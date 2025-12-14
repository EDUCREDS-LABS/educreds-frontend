import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StudentPage from "@/pages/student/StudentPage";

interface StudentPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentPortalModal({ open, onOpenChange }: StudentPortalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Portal</DialogTitle>
        </DialogHeader>
        <StudentPage />
      </DialogContent>
    </Dialog>
  );
}