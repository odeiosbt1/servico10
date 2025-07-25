import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase"; // ajuste o caminho se necessário

interface DadosUsuario {
  nome: string;
  cpf: string;
  telefone: string;
  bairro: string;
  tipoDeConta: "prestador" | "contratante";
  servico?: string;
}
await salvarUsuarioNoFirestore({
  nome,
  cpf,
  telefone,
  bairro,
  tipoDeConta,
  servico
});

export const salvarUsuarioNoFirestore = async (dados: DadosUsuario) => {
  const usuario = auth.currentUser;

  if (!usuario) throw new Error("Usuário não autenticado.");

  const docRef = doc(db, "usuarios", usuario.uid);

  await setDoc(docRef, {
    ...dados,
    email: usuario.email,
    uid: usuario.uid,
    criadoEm: new Date(),
  });
};
