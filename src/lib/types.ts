
export interface ImageUploadProps {
    title: string;
    description: string;
    file: File | null;
    onUpload: (file: File) => void;
    onRemove?: () => void;
    onSelectPrevious?: (imageUrl: string) => void;
    type: "model" | "garment";
    icon?: React.ReactNode;
  }
  
 export interface PreviousImage {
    id: string;
    url: string;
    createdAt: string;
    category?: string;
  }
  