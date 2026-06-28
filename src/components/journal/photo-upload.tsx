import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 4 }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return
    if (photos.length + acceptedFiles.length > maxPhotos) {
      toast.error(`You can only upload up to ${maxPhotos} photos`)
      return
    }

    setIsUploading(true)
    const newPhotos = [...photos]

    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('journal-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('journal-photos')
          .getPublicUrl(filePath)

        newPhotos.push(publicUrl)
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    onChange(newPhotos)
    setIsUploading(false)
  }, [photos, onChange, maxPhotos, user, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading || photos.length >= maxPhotos
  })

  const removePhoto = (indexToRemove: number) => {
    onChange(photos.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none">
        Photos ({photos.length}/{maxPhotos})
      </label>

      {/* Upload Zone */}
      {photos.length < maxPhotos && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <ImagePlus className="w-8 h-8" />
            )}
            <p className="text-sm font-medium">
              {isUploading ? 'Uploading...' : isDragActive ? 'Drop photos here' : 'Click or drag photos here'}
            </p>
            {!isUploading && (
              <p className="text-xs">Supports JPG, PNG, WEBP</p>
            )}
          </div>
        </div>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
              <Image 
                src={photoUrl} 
                alt={`Upload preview ${index + 1}`} 
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
