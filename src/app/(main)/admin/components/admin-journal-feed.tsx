'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'

export function AdminJournalFeed({ initialJournals }: { initialJournals: any[] }) {
  const [journals, setJournals] = useState(initialJournals)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)
  const supabase = createClient()

  const deleteJournal = async (journalId: string) => {
    try {
      setIsDeleting(journalId)
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', journalId)

      if (error) throw error

      setJournals(journals.filter(j => j.id !== journalId))
      toast.success('Journal deleted globally')
      setOpenDialogId(null)
    } catch (error: any) {
      toast.error('Failed to delete journal')
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Global Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {journals?.length ? (
            journals.map((journal: any) => (
              <div key={journal.id} className="flex flex-col gap-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold truncate">{journal.title || 'Untitled Entry'}</p>
                    <p className="text-xs text-muted-foreground">
                      By @{journal.profiles?.username || 'unknown'} • {new Date(journal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Dialog open={openDialogId === journal.id} onOpenChange={(open) => setOpenDialogId(open ? journal.id : null)}>
                    <DialogTrigger className="appearance-none">
                      <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-destructive h-10 w-10 text-muted-foreground shrink-0 cursor-pointer">
                           {isDeleting === journal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Journal Entry?</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 text-sm text-muted-foreground">
                        This will permanently delete this journal entry from the database. The user will lose this data. Are you sure?
                      </div>
                      <div className="flex justify-end gap-3 mt-4">
                        <DialogClose className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          Cancel
                        </DialogClose>
                        <Button variant="destructive" onClick={() => deleteJournal(journal.id)}>
                          Delete Permanently
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent journals found.</p>
          )}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>Because you are an admin, you can see and delete all journals globally. Please respect user privacy.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
