import { ContainerInstance } from "di-at-home";

const Injectables = {
  Config: "Config",
  Logger: "Logger",
  Docker: "Docker",
  SDK: "SDK",
} as const;

const DI = Object.assign(
  new ContainerInstance<{
    Config: [];
    Logger: [string];
    Docker: [];
    SDK: [];
  }>(),
  Injectables,
);

export default DI;
