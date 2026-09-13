export interface ErrorModalProps {
  show: boolean
  title: string
  message: string
  actionText?: string
  actionUrl?: string
  onClose: () => void
}
