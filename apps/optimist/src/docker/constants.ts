export const CONTAINER_OUTPUT_DIR = "/tmp/output";

export const PIPELINE_STAGES = `
- labeldrop:
  - container
  - filename
  - host
  - source
`.trim();

export const OPTIMISTIC_LABEL = "foundation.gearbox.optimistic";
export const EXECUTION_ID_LABEL = "foundation.gearbox.execution-id";
