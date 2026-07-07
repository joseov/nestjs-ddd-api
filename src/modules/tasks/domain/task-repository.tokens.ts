// DI Symbol tokens for the tasks repository ports.
// Used as injection tokens in NestJS providers — declared in the domain so
// that application-layer handlers can reference them without importing infra.
export const TASK_WRITE_REPOSITORY = Symbol('TASK_WRITE_REPOSITORY');
export const TASK_READ_REPOSITORY = Symbol('TASK_READ_REPOSITORY');
