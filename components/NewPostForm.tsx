import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Upload from '@/components/Upload';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"
import Link from 'next/link';
import {
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useNetwork } from 'wagmi';

type ReplyingTo = {
  address: string;
  cid: string;
};

interface Props {
  onSubmit?: (event: Event) => void;
  replyingTo?: ReplyingTo;
  placeholder?: string;
}

type UploadedFile = {
  cid: string;
  name: string;
  fileType: 'image' | 'video';
};

const NewPostForm: React.FC<Props> = ({
  onSubmit,
  replyingTo,
  placeholder,
}) => {
  const { data: session } = useSession() || {};
  const [nftName, setNftName] = useState('');
  const [postText, setPostText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { chain } = useNetwork();

  const handlePostTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  };

  const handleNftNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNftName(e.target.value);
  }

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFiles([...uploadedFiles, file]);
  };

  const handleRemoveFile = (cid: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.cid !== cid)
    );
  };

  const handleSubmit = async () => {
    setIsPosting(true);
    setUploadError('');
  
    try {
      const imagesResponse = await fetch('/api/images/f');
      let beforeImages = [];
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        console.log("IMAGES DATA: ", imagesData)
        beforeImages = imagesData.map(image => "https://gateway.lighthouse.storage/ipfs/" + image);
      }
      console.log("BEFORE IMAGES: ", beforeImages);
  
      const currentImage = uploadedFiles[0] ? "https://gateway.lighthouse.storage/ipfs/" + uploadedFiles[0].cid : null;
  
      if (!currentImage) {
        throw new Error("No image to upload");
      }
  
      let highSimilarity = false;
      if (beforeImages.length > 0) {
        const similarityResponse = await fetch('https://ai.luxora.space/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current: currentImage,
            before: beforeImages,
          }),
        });
  
        if (!similarityResponse.ok) {
          throw new Error("Failed to compare image");
        }
  
        const similarityData = await similarityResponse.json();
        console.log("SIMILARITY DATA: ", similarityData);

        const mostSimilarImage = similarityData.reduce((mostSimilar, current) => {
          return (current[1] > mostSimilar[1]) ? current : mostSimilar;
        }, ["", 0]);

        if (mostSimilarImage[1] > 0.95) {
          const similarityPercentage = (mostSimilarImage[1] * 100).toFixed(2);
          throw new Error(`Image is ${similarityPercentage}% similar to an existing image`);
        }
      }
  
      const postData = {
        chain: chain?.name || 'Polygon zkEVM Testnet',
        content: postText,
        files: uploadedFiles,
        ...(replyingTo && { replyingTo }),
      };
  
      const postRequest = await fetch('/api/post/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postData }),
      });
  
      if (!postRequest.ok) {
        throw new Error("Failed to submit post");
      }
  
      const postResponse = await postRequest.json();
      console.log("POST DATA: ", postResponse);
  
      if (postResponse.success) {
        console.log('Successfully posted:', postResponse.postCreationData.cid);
        console.log('Now gonna mint NFT');
  
        const mintRequest = await fetch('/api/nft/mint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_cid: postData.files[0].cid,
            nft_name: nftName,
            nft_description: postText,
            chain: chain?.name || 'Polygon zkEVM Testnet'
          }),
        });
  
        const mintResponse = await mintRequest.json();
        console.log("MINT DATA: ", mintResponse);
  
        if ((mintResponse as any).success) {
          
          const transactionUpdateRequest = await fetch('/api/post/update/transactionurl', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cid: postResponse.postCreationData.cid,
              blockchain: chain?.name || 'Polygon zkEVM Testnet',
              hash: mintResponse.receipt.hash
            }),
          });
        
          if (!transactionUpdateRequest.ok) {
            throw new Error("Failed to update transaction URL");
          }
        
          const transactionUpdateResponse = await transactionUpdateRequest.json();
          console.log("TRANSACTION UPDATE DATA: ", transactionUpdateResponse);

          setPostText('');
          setNftName('');
          setUploadedFiles([]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadError((error as any).message);
    } finally {
      setIsPosting(false);
    }
  };  

  const myAddress = (session?.user as any)?.address || '';

  return (
    <>
    <div className="flex items-start">
        <div className="flex-grow">
          <Input
            value={nftName}
            onChange={handleNftNameChange}
            placeholder="NFT Name"
            className="mb-3"
          />
        </div>
      </div>
      <div className="flex items-start">
        <div className="flex-grow">
          <Textarea
            value={postText}
            onChange={handlePostTextChange}
            placeholder={placeholder || "What's on your mind?"}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-start items-center space-x-2">
          <Upload
            onFileUpload={handleFileUpload}
            onError={(e) => setUploadError(e)}
          >
            <button
              className="btn btn-ghost btn-circle"
              onClick={(e) => e.preventDefault()}
            >
              <PaperClipIcon width={24} />
            </button>
          </Upload>
          {uploadedFiles.map((file) => (
            <div key={file.cid} className="flex items-center space-x-1">
              {file.fileType === 'image' ? (
                <PhotoIcon width={20} />
              ) : (
                <VideoCameraIcon width={20} />
              )}
              <span className="text-sm">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(file.cid)}
                className="text-purple-500 hover:text-purple-600"
              >
                <XMarkIcon width={14} />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isPosting || (postText.length === 0 && uploadedFiles.length === 0)}
        >
          {isPosting ? 'Posting...' : 'Post'}
        </Button>
      </div>
      {uploadError && <p className="text-red-500">{uploadError}</p>}
    </>
  );
};

export default NewPostForm;