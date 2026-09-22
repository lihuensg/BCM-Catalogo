import { Skeleton } from '@/components/ui/surfaces';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/services/admin/errors';
export function AsyncState({ loading, error, retry }: {
    loading?: boolean;
    error?: unknown;
    retry: () => void;
}) { if (loading)
    return <Skeleton />; if (error)
    return <div className="notice notice-error" role="alert"><p>{errorMessage(error)}</p><Button className="button-secondary" onClick={retry}>Volver a intentar</Button></div>; return null; }
