import { useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import styles from './PerfilEstabelecimento.module.css';

function PerfilEstabelecimento() {
  const [step, setStep] = useState('perfil');

  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  // Estados futuros para abrir modais ou controlar o fluxo se necessário
  function handleBuscarCliente(e) {
    e.preventDefault();
    if (busca.trim()) {
      // Redireciona para uma página de busca geral ou para o subdomínio da empresa
      navigate(`/buscar?q=${encodeURIComponent(busca)}`);
    }
  }

  return (
    <div className={styles.pageWrapper}>
          
          {/* TELA 1: PERFIL */}
          {step === 'perfil' && (
             <div className={styles.wrapper}>
                  {/* 1. CABEÇALHO (NAVBAR) */}
                  <button onClick={() => setStep('formulario')} className={styles.btnActionPrimary}>
                                  📅 Iniciar Agendamento
                                </button>
                  <header className={styles.navbar}>
                    <div className={styles.logo}>
                      <span>AgendAí</span>
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
                    href="https://wa.me." 
                    className={styles.whatsappFloat}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contato via WhatsApp"
                  >
                    💬
                  </a>
                </div>
          )}
    
          {/* TELA 2: FORMULÁRIO */}
          {step === 'formulario' && (
             <div className={styles.cardContainer}>
               <form onSubmit={handleBuscarCliente} className={styles.searchBox}>
                        <input 
                          type="text" 
                          placeholder="Buscar estabelecimento..." 
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                        />
                        <button type="submit" className={styles.btnSearch}>🔍</button>
                      </form>
                      <div>
                        <div className={styles.profileHeader}>
                          <div className={styles.avatarCircle}>
                            Compania
                          </div>
                          <h1>nome da companhia</h1>
                          <p>Agendamento online rápido e seguro</p>
                        </div>
            
                        <div className={styles.welcomeBody}>
                          <h2>Olá! Seja bem-vindo(a).</h2>
                          <p>Escolha os melhores serviços, veja os horários disponíveis e reserve o seu atendimento em poucos cliques.</p>
                          
                          <button onClick={() => setStep('perfil')} className={styles.btnActionPrimary}>
                            📅 VAI PARA INÍCIO
                          </button>
                        </div>
                      </div>
            
                      <div className={styles.profileFooter}>
                         
                          <a 
                            href={`https://wa.me{company.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.whatsappLink}
                          >
                            💬 Precisa de ajuda? Falar com o local
                          </a>
                        
                        <p>© Todos os direitos reservados.</p>
                      </div>
                    </div>
          )}
    
        </div>
  );
}

export default PerfilEstabelecimento;
