export default function TermosPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#333', lineHeight: '1.6' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #eee' }}>
        <h1 style={{ color: '#1a1a1a', marginBottom: '20px', fontSize: '2rem' }}>Termos de Uso e Privacidade</h1>
        <p>Bem-vindo ao <strong>Procuro Quem Faça</strong>. Estes termos explicam como nossa plataforma funciona para prestadores e clientes em Londrina e Região.</p>

        <h2 style={{ color: '#0070f3', marginTop: '30px' }}>1. O que somos?</h2>
        <p>O <strong>Procuro Quem Faça</strong> é um guia de busca local. Facilitamos o encontro entre quem precisa de um serviço e quem sabe fazer. Não temos vínculo empregatício com nenhum prestador cadastrado.</p>

        <h2 style={{ color: '#0070f3', marginTop: '30px' }}>2. Uso de Dados (LGPD)</h2>
        <p>Para que o serviço funcione em Londrina e região, você concorda que:</p>
        <ul>
          <li>Seu <strong>Nome, Foto e Categoria</strong> de serviço fiquem visíveis para todos.</li>
          <li>Seu <strong>Telefone de contato</strong> seja exibido para clientes interessados.</li>
          <li>Usaremos seu e-mail apenas para segurança e acesso à sua conta.</li>
        </ul>

        <h2 style={{ color: '#0070f3', marginTop: '30px' }}>3. Responsabilidade</h2>
        <p>Cada prestador é responsável pela qualidade do seu trabalho e pela negociação de valores com o cliente. O <strong>Procuro Quem Faça</strong> não intermedia pagamentos.</p>

        <h2 style={{ color: '#0070f3', marginTop: '30px' }}>4. Avaliações</h2>
        <p>A transparência é a base do nosso site. Clientes podem avaliar prestadores, e nós nos reservamos o direito de remover perfis com informações falsas ou conduta inadequada.</p>

        <footer style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center', color: '#666' }}>
          <p>© {new Date().getFullYear()} Procuro Quem Faça - Londrina e Região</p>
        </footer>
      </div>
    </main>
  );
}