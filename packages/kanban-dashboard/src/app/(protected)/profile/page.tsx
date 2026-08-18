import { ActionForm } from '../../../components/ui/action-form';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { logoutAllAction, updateProfileAction } from '../../../features/kanban/actions';
import { getProfile } from '../../../lib/api/kanban';
export default async function ProfilePage(){const user=await getProfile();return <div className="mx-auto max-w-2xl space-y-6"><div><h1 className="text-3xl font-semibold">Profile</h1><p className="mt-2 text-muted">Identity and active-session security.</p></div><Card className="p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Account</h2><Badge>{user.systemRole}</Badge></div><ActionForm action={updateProfileAction} submitLabel="Update profile" className="space-y-4"><label className="block text-sm">Name<Input className="mt-2" name="name" defaultValue={user.name} required/></label><label className="block text-sm">Email<Input className="mt-2" name="email" type="email" defaultValue={user.email} required/></label></ActionForm></Card><Card className="p-6"><h2 className="font-semibold">Session security</h2><p className="my-3 text-sm text-muted">Revoke every refresh session, including this device.</p><form action={logoutAllAction}><Button variant="danger">Log out all devices</Button></form></Card></div>}
