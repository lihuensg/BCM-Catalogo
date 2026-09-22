/** Domain errors contain safe messages; persistence errors are mapped at the boundary. */
export class DomainError extends Error {
    constructor(public readonly code: string, message: string, public readonly status = code.endsWith('_NOT_FOUND') ? 404 : 409) {
        super(message);
        this.name = 'DomainError';
    }
}
