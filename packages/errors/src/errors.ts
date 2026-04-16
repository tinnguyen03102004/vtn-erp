// ================================================================
// Domain-specific error classes for VTN-ERP
// ================================================================

export class VtnError extends Error {
    public readonly code: string
    public readonly statusCode: number

    constructor(message: string, code = 'INTERNAL_ERROR', statusCode = 500) {
        super(message)
        this.name = 'VtnError'
        this.code = code
        this.statusCode = statusCode
    }
}

export class NotFoundError extends VtnError {
    constructor(entity: string, id?: string) {
        super(
            id ? `${entity} không tìm thấy (ID: ${id})` : `${entity} không tìm thấy`,
            'NOT_FOUND',
            404,
        )
        this.name = 'NotFoundError'
    }
}

export class ForbiddenError extends VtnError {
    constructor(message = 'Bạn không có quyền thực hiện thao tác này') {
        super(message, 'FORBIDDEN', 403)
        this.name = 'ForbiddenError'
    }
}

export class ValidationError extends VtnError {
    public readonly fieldErrors: Record<string, string>

    constructor(message: string, fieldErrors: Record<string, string> = {}) {
        super(message, 'VALIDATION_ERROR', 400)
        this.name = 'ValidationError'
        this.fieldErrors = fieldErrors
    }
}
