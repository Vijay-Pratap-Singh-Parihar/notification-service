export abstract class AppError extends Error {
  abstract statusCode: number;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
export class NotFoundError extends AppError { statusCode = 404; constructor(resource = 'Resource'){ super(`${resource} not found`);} }
export class ValidationError extends AppError { statusCode = 400; constructor(message: string){ super(message);} }
export class ConflictError extends AppError { statusCode = 409; constructor(message: string){ super(message);} }


