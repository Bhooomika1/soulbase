'use client';

import { useState, useEffect, FC } from 'react';
import { getCsrfToken, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Upload from '@/components/Upload';
import { useAccount, useNetwork, useSignMessage } from 'wagmi';
import { ExtendedSiweMessage } from '@/utils/ExtendedSiweMessage';
import QRCode from "react-qr-code";
import { io } from "socket.io-client";
import Modal from 'react-modal';
import { ClipLoader } from 'react-spinners';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UploadedFile = {
  cid: string;
  name: string;
  fileType: 'image' | 'video';
};

const SignupPage: FC = () => {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState('');
  const { signMessageAsync } = useSignMessage();
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const [sessionId, setSessionId] = useState('');
  const [qrCodeData, setQrCodeData] = useState();
  const [isHandlingVerification, setIsHandlingVerification] = useState(false);
  const [verificationCheckComplete, setVerificationCheckComplete] = useState(false);
  const [verificationMessage, setVerfificationMessage] = useState('');
  const [socketEvents, setSocketEvents] = useState<any[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const publicServerURL = "https://72b4-14-195-9-98.ngrok.io";
  const localServerURL = "http://localhost:8080";

  const serverUrl = window.location.href.startsWith("https")
    ? publicServerURL
    : localServerURL;

  const socket = io(serverUrl);

  useEffect(() => {
    socket.on("connect", () => {
      setSessionId(socket.id);

      // only watch this session's events
      socket.on(socket.id, (arg) => {
        setSocketEvents((socketEvents) => [...socketEvents, arg]);
      });
    });
  }, []);

  useEffect(() => {
    if (socketEvents.length) {
      const currentSocketEvent = socketEvents[socketEvents.length - 1];

      if (currentSocketEvent.fn === "handleVerification") {
        if (currentSocketEvent.status === "IN_PROGRESS") {
          setIsHandlingVerification(true);
        } else {
          setIsHandlingVerification(false);
          setVerificationCheckComplete(true);
          if (currentSocketEvent.status === "DONE") {
            setVerfificationMessage("✅ Verified proof");
            setTimeout(() => {
              reportVerificationResult(true);
            }, 2000);
            socket.close();
          } else {
            setVerfificationMessage("❌ Error verifying VC");
          }
        }
      }
    }
  }, [socketEvents]);

  const reportVerificationResult = (result: boolean) => {
    handleSignUp(result, true);
  };

  const handleSignUp = async (result: boolean, isVerified: boolean) => {
    try {
      if (result) {
        const callbackUrl = '/';
        const message = new ExtendedSiweMessage({
          domain: window.location.host,
          address: address,
          name: name,
          username: username,
          pfp: uploadedFiles[0].cid,
          statement: 'Sign up to luxora',
          isVerified,
          uri: window.location.origin,
          version: '1',
          chainId: chain?.id,
          nonce: await getCsrfToken(),
        });
        const signature = await signMessageAsync({
          message: message.prepareMessage(),
        });
        signIn('credentials', {
          message: JSON.stringify(message),
          redirect: false,
          signature,
          callbackUrl,
        });
        router.push('/');
      }
    } catch (error) {
      console.log(error);
    }
  };

  function handleSignUpButton() {
    handleSignUp(true, false);
  }

  const getQrCodeApi = (sessionId: string, name: string) =>
    serverUrl + `/api/get-auth-qr?sessionId=${sessionId}&fullName=${encodeURIComponent(name)}`;

  const handleProveAccessRights = async () => {
    const fetchQrCode = async () => {
      const response = await fetch(getQrCodeApi(sessionId, name));
      const data = await response.text();
      return JSON.parse(data);
    };

    if (sessionId) {
      fetchQrCode().then(setQrCodeData).catch(console.error);
      // onOpen();
      setModalIsOpen(true);
    }
  };

  const customStyles = {
    content: {
      top: '45%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '18.5%',
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '20px'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0)'
    }
  };

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFiles([...uploadedFiles, file]);
  };

  const handleRemoveFile = (cid: string) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.cid !== cid)
    );
  };

  const isFormValid = () => {
    return (
      name.trim() !== '' &&
      username.trim() !== '' &&
      uploadedFiles.length > 0
    );
  };

  return (
    <div className="flex justify-center items-center h-screen" style={{ marginTop: '-5%' }}>
      <Card className="w-96">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            to luxora
          </CardDescription>
        </CardHeader>
        <CardContent> 
          <div className="grid gap-2 mb-2">
            <Label>Name</Label>
            <Input
              autoFocus={true}
              type="text"
              className="input-bordered input-primary input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input
              autoFocus={true}
              type="text"
              className="input-bordered input-primary input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mt-2">
          <div>
            <Label>Profile Picture</Label>
          </div>
          <div className="flex items-center space-x-2 mt-2 mb-4">
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
          {uploadError && <p className="text-warning">{uploadError}</p>}
        </div>
        
          <Button className="w-full mb-2" onClick={handleSignUpButton} disabled={!isFormValid()}>
            Create Account without Verifying
          </Button>
          
          {sessionId ? (
            <Button
              className="w-full"
              onClick={handleProveAccessRights}
              disabled={!isFormValid()}
            >
              Verify Using Polygon ID
            </Button>
          ) : (
            <ClipLoader color={"#553C9A"} size={30} />
          )}
        </CardContent>

        {qrCodeData && (
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            style={customStyles}
          >
            {isHandlingVerification && (
              <div style={{ backgroundColor: 'white', padding: '20px'}}>
                <h1 style={{ color: 'black', fontWeight: 600 }}>Authenticating...</h1>
                <ClipLoader color={"#553C9A"} size={30} />
              </div>
            )}
            {qrCodeData && !isHandlingVerification && !verificationCheckComplete && (
              <>
                <h1 style={{ color: 'black', fontWeight: 600 }}>Scan this QR code from your Polygon ID Wallet App to prove your identity</h1>
                <div style={{ backgroundColor: 'white', padding: '20px' }}>
                  <QRCode value={JSON.stringify(qrCodeData)} />
                </div>
              </>
            )}
          </Modal>
        )}
      </Card>
    </div>
  );
};

export default SignupPage;
