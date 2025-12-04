import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  const validateAndPass = (file: File) => {
    if (file.type.startsWith('video/')) {
      onFileSelect(file);
    } else {
      alert("Please upload a valid video file.");
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const uploadAreaStyle: React.CSSProperties = {
    position: 'relative',
    padding: '3rem',
    border: `2px dashed ${dragActive ? '#2563eb' : '#e5e5e5'}`,
    borderRadius: '1rem',
    transition: 'all 200ms ease-in-out',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: dragActive ? '#ffffff' : '#fafafa',
    transform: dragActive ? 'scale(1.01)' : 'scale(1)',
    animation: dragActive ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
  };

  const iconContainerStyle: React.CSSProperties = {
    padding: '1.25rem',
    borderRadius: '50%',
    backgroundColor: dragActive ? '#eff6ff' : '#ffffff',
    color: dragActive ? '#2563eb' : '#404040',
    display: 'inline-flex',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    transition: 'all 200ms ease-in-out',
  };

  return (
    <div style={{ width: '100%', maxWidth: '42rem', margin: '0 auto', animation: 'fadeInUp 0.4s ease-out' }}>
      <div 
        style={uploadAreaStyle}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        onMouseEnter={(e) => {
          if (!dragActive) {
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'scale(1.01)';
          }
        }}
        onMouseLeave={(e) => {
          if (!dragActive) {
            e.currentTarget.style.borderColor = '#e5e5e5';
            e.currentTarget.style.backgroundColor = '#fafafa';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <input 
          ref={inputRef}
          type="file" 
          style={{ display: 'none' }}
          accept="video/*"
          onChange={handleChange}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={iconContainerStyle}>
            <UploadCloud size={48} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#0a0a0a', margin: 0 }}>
              Upload Lesson Recording
            </h3>
            <p style={{ fontSize: '1rem', color: '#404040', margin: 0 }}>
              Drag & drop a video file here, or click to browse
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#d97706',
            backgroundColor: '#fffbeb',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #fef3c7',
            marginTop: '1rem',
          }}>
            <AlertCircle size={14} />
            <span>Note: For this web demo, shorter clips (under 200MB) work best due to browser limits.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
