import { useNavigate } from "react-router-dom";
import nacl from "tweetnacl";
import { decode as decodeBase64 } from "@stablelib/base64";
import { useChatStore } from "@/store/chat-store";
import { socketService } from "@/lib/socket";
import { storeKeyPair } from "@/lib/storage";
import { toast } from "sonner";

export function useAuth() {
  const { username, setUsername } = useChatStore();
  const navigate = useNavigate();

  const login = async (privateKey: string, user?: string) => {
    const secretKey = decodeBase64(privateKey);
    if (secretKey.length !== nacl.box.secretKeyLength) {
      toast.error("Invalid private key length.");
      return;
    }

    const { available } = await socketService.checkUsername(user || username);
    if (!user && available) {
      toast.error("Username not registered.");
      return;
    }

    const { publicKey } = await socketService.getPublicKey(user || username);
    const keyPair = { publicKey: decodeBase64(publicKey), secretKey };
    storeKeyPair(keyPair);
    setUsername(user || username);
    socketService.connect(user || username);
    toast.success(`Welcome back, ${user || username}!`);
    navigate("/");
  };

  return { username, login };
}
