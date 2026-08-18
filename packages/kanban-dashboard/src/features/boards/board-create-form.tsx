import { ActionForm } from '../../components/ui/action-form';
import { Input } from '../../components/ui/input';
import { createBoardAction } from '../kanban/actions';
export function BoardCreateForm(){return <ActionForm action={createBoardAction} submitLabel="Create board" className="space-y-4"><label className="block text-sm font-medium text-zinc-200">Board name<Input className="mt-2" name="name" maxLength={160} required/></label><label className="block text-sm font-medium text-zinc-200">Description<textarea name="description" maxLength={5000} className="mt-2 min-h-24 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"/></label></ActionForm>}
