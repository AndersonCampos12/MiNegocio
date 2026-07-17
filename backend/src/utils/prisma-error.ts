export type PrismaErrorLike = {
    code?: string;
    meta?: { target?: string | string[] };
};

export const isPrismaError = (error: unknown, code: string): error is PrismaErrorLike => {
    return typeof error === 'object' && error !== null && (error as PrismaErrorLike).code === code;
};

export const prismaErrorFields = (error: PrismaErrorLike): string[] => {
    const target = error.meta?.target;
    if (Array.isArray(target)) return target.map(String);
    return typeof target === 'string' ? [target] : [];
};
