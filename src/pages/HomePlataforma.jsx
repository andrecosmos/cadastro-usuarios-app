import {FaWhatsapp} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './HomePlataforma.module.css';

function HomePlataforma() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      {/* 1. CABEÇALHO (NAVBAR) */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <span>AGENDA</span>
        </div>
        <nav className={styles.menuLinks}>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#nichos">Nichos</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className={styles.navActions}>
          <button 
            className={styles.btnLink} 
            onClick={() => navigate('/login')}
          >
            Entrar
          </button>
          <button 
            className={styles.primaryInline} 
            onClick={() => navigate('/empresa/nova')}
          >
            Criar Conta
          </button>
        </div>
      </header>

      {/* 2. SEÇÃO PRINCIPAL (HERO SECTION) */}
      <section className={styles.heroSection}>
        <span className={styles.badge}>⚡ AGENDA INTELIGENTE MULTI-NICHO</span>
        <h1>O sistema de agendamento que transforma o seu negócio.</h1>
        <p>
          Seja você dono de barbearia, clínica ou salão de beleza: automatize seus 
          horários, elimine o vai e vem de mensagens e reduza as faltas em até 80%.
        </p>

        <div className={styles.ctaContainer}>
          <button 
            className={styles.primaryHero}
            onClick={() => navigate('/empresa/nova')}
          >
            🚀 Cadastrar meu Negócio (Grátis)
          </button>
        </div>
      </section>

      {/* 2. SEÇÃO PRINCIPAL (HERO SECTION) */}
{/* ... código da sua hero section ... */}

{/* Nova Seção: 2.5. FUNCIONALIDADES DETALHADAS */}
<section id="funcionalidades" className={styles.featuresSection}>
  <div className={styles.featuresHeader}>
    <span>Recursos Estratégicos</span>
    <h2>Tudo o que sua empresa precisa para crescer</h2>
    <p>Substitua o papel e as planilhas por uma gestão totalmente automatizada, segura e inteligente.</p>
  </div>

  <div className={styles.featuresGrid}>
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>📆</div>
      <h3>Agenda Online 24/7</h3>
      <p>Permita que seus clientes agendem horários a qualquer hora do dia ou da noite, mesmo quando sua empresa estiver fechada.</p>
    </div>

    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>🔔</div>
      <h3>Lembretes Automáticos</h3>
      <p>Envios automáticos via WhatsApp e E-mail para confirmar horários, reduzindo drasticamente os esquecimentos e as faltas.</p>
    </div>

    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>📊</div>
      <h3>Gestão Financeira</h3>
      <p>Controle o fluxo de caixa, faturamento mensal, comissões de funcionários e saiba exatamente de onde vem o seu lucro.</p>
    </div>

    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>👤</div>
      <h3>Painel do Profissional</h3>
      <p>Seus colaboradores acessam de forma individual suas próprias agendas, acompanhando os agendamentos e metas diárias.</p>
    </div>

    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>🔗</div>
      <h3>Link de Agendamento Único</h3>
      <p>Um link exclusivo para colocar na bio do Instagram ou enviar no WhatsApp direto para o seu catálogo de serviços.</p>
    </div>

    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>🛡️</div>
      <h3>Política de Cancelamento</h3>
      <p>Configure regras automáticas de cobrança antecipada ou taxas para cancelamentos em cima da hora, protegendo sua receita.</p>
    </div>
  </div>
</section>

{/* 3. VITRINE DE NICHOS */}
{/* ... código da sua vitrine de nichos ... */}



      {/* 3. VITRINE DE NICHOS */}
      <section id="nichos" className={styles.vitrineSection}>
        <div className={styles.vitrineHeader}>
          <h2>Feito para o seu segmento</h2>
          <p>Não importa o seu nicho, nossa plataforma se adapta perfeitamente à rotina do seu atendimento.</p>
        </div>

        <div className={styles.gridNichos}>
          <div className={styles.cardNicho}>
            <div className={styles.iconContainer}>🪒</div>
            <h3>Barbearias & Salões</h3>
            <p>Gestão de profissionais, divisão de comissões por atendimento, combos de serviços e controle dinâmico de fluxo diário.</p>
            <span className={`${styles.tag} ${styles.tagPopular}`}>Mais popular</span>
          </div>

          <div className={styles.cardNicho}>
            <div className={styles.iconContainer}>✨</div>
            <h3>Clínicas & Estética</h3>
            <p>Intervalos personalizados obrigatórios entre consultas, fichas de histórico simples e controle integrado de salas ou equipamentos.</p>
            <span className={`${styles.tag} ${styles.tagPremium}`}>Premium</span>
          </div>

          <div className={styles.cardNicho}>
            <div className={styles.iconContainer}>🐾</div>
            <h3>Pet Shops & Veterinárias</h3>
            <p>Agendamentos inteligentes baseados no porte do animal, histórico clínico do pet e automação de serviços recorrentes de banho e tosa.</p>
          </div>

          <div className={styles.cardNicho}>
            <div className={styles.iconContainer}>✒️</div>
            <h3>Estúdios & Autônomos</h3>
            <p>Links diretos e amigáveis para a bio do Instagram, depósitos parciais de sinal para evitar faltas e flexibilidade total de horários.</p>
          </div>
        </div>
      </section>

      {/* 4. BOTÃO FLUTUANTE DO WHATSAPP */}
      <a 
        href="https://wa.me/5511971927935" 
        className={styles.whatsappFloat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contato via WhatsApp"
      >
       <FaWhatsapp size={30} />
      </a>
    </div>
  );
}

export default HomePlataforma;
