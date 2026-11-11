import { Redirect } from 'expo-router';

// A antiga lista de Produtos foi unificada na página Estoque
// (produtos sem lotes aparecem lá com "Sem lotes cadastrados").
export default function ProdutosRedirect() {
  return <Redirect href="/estoque" />;
}
