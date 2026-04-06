use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

const AGENT_SIDECAR_NAME: &str = "agent-runtime";
const AGENT_EVENT_CHANNEL: &str = "agent-runtime:event";
const AGENT_ERROR_CHANNEL: &str = "agent-runtime:error";
const AGENT_TERMINATED_CHANNEL: &str = "agent-runtime:terminated";

#[derive(Default)]
struct AgentRuntimeState {
    child: Mutex<Option<CommandChild>>,
}

fn lock_agent_state<'a, 'r>(
    state: &'a State<'r, AgentRuntimeState>,
) -> Result<std::sync::MutexGuard<'a, Option<CommandChild>>, String> {
    state
        .child
        .lock()
        .map_err(|_| "Agent runtime state lock is poisoned.".to_string())
}

fn push_runtime_lines(buffer: &mut String, chunk: &[u8]) -> Vec<String> {
    buffer.push_str(&String::from_utf8_lossy(chunk));

    let mut lines = Vec::new();
    while let Some(newline_index) = buffer.find('\n') {
        let line: String = buffer.drain(..=newline_index).collect();
        let trimmed_line = line.trim();
        if !trimmed_line.is_empty() {
            lines.push(trimmed_line.to_string());
        }
    }

    lines
}

#[tauri::command]
fn get_workspace_path(app: AppHandle) -> Result<String, String> {
    let workspace_path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&workspace_path).map_err(|error| error.to_string())?;

    Ok(workspace_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn start_agent_runtime(
    app: AppHandle,
    state: State<'_, AgentRuntimeState>,
) -> Result<String, String> {
    let mut runtime_child = lock_agent_state(&state)?;
    if runtime_child.is_some() {
        return Ok("already-running".to_string());
    }

    let (mut event_receiver, child) = app
        .shell()
        .sidecar(AGENT_SIDECAR_NAME)
        .map_err(|error| error.to_string())?
        .spawn()
        .map_err(|error| error.to_string())?;

    let event_app = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut stdout_buffer = String::new();
        let mut stderr_buffer = String::new();

        while let Some(event) = event_receiver.recv().await {
            match event {
                CommandEvent::Stdout(chunk) => {
                    for payload in push_runtime_lines(&mut stdout_buffer, &chunk) {
                        let _ = event_app.emit(AGENT_EVENT_CHANNEL, payload);
                    }
                }
                CommandEvent::Stderr(chunk) => {
                    for payload in push_runtime_lines(&mut stderr_buffer, &chunk) {
                        let _ = event_app.emit(AGENT_ERROR_CHANNEL, payload);
                    }
                }
                CommandEvent::Terminated(status) => {
                    let _ = event_app.emit(AGENT_TERMINATED_CHANNEL, status);
                }
                _ => {}
            }
        }
    });

    *runtime_child = Some(child);

    Ok("started".to_string())
}

#[tauri::command]
fn send_agent_command(state: State<'_, AgentRuntimeState>, command: String) -> Result<(), String> {
    if command.trim().is_empty() {
        return Err("Agent command cannot be empty.".to_string());
    }

    let mut runtime_child = lock_agent_state(&state)?;
    let child = runtime_child
        .as_mut()
        .ok_or_else(|| "Agent runtime is not running.".to_string())?;

    let command_line = format!("{command}\n");
    child
        .write(command_line.as_bytes())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn stop_agent_runtime(state: State<'_, AgentRuntimeState>) -> Result<(), String> {
    let mut runtime_child = lock_agent_state(&state)?;
    if let Some(child) = runtime_child.take() {
        child.kill().map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AgentRuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            get_workspace_path,
            start_agent_runtime,
            send_agent_command,
            stop_agent_runtime
        ])
        .run(tauri::generate_context!())
        .expect("error while running paper-read application");
}
