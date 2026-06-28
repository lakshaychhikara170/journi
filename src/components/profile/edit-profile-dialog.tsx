'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function EditProfileDialog({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  })
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user) return

      setIsUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // We use the same bucket for now, or you could create an 'avatars' bucket
      // Since 'journal-photos' exists, we can use that, or just use 'avatars' if we had one.
      // Assuming 'avatars' bucket exists in a standard Supabase project:
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        // Fallback to journal-photos if avatars bucket doesn't exist
        const { error: fallbackError } = await supabase.storage
          .from('journal-photos')
          .upload(`avatars/${filePath}`, file)
        
        if (fallbackError) throw fallbackError

        const { data } = supabase.storage.from('journal-photos').getPublicUrl(`avatars/${filePath}`)
        setAvatarUrl(data.publicUrl)
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setAvatarUrl(data.publicUrl)
      }
      
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username is already taken')
        }
        throw error
      }

      toast.success('Profile updated! Refresh to see changes.')
      setIsOpen(false)
      // Note: Ideally we update the store here, but a refresh is easy for now
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <div className={`w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden relative bg-muted flex items-center justify-center ${isUploadingImage ? 'opacity-50' : ''}`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl bg-primary/10 text-primary w-full h-full flex items-center justify-center">
                    {formData.full_name?.charAt(0) || formData.username?.charAt(0) || '?'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  {isUploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-xs font-semibold">Change</span>}
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us a little bit about yourself"
              className="resize-none h-24"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
