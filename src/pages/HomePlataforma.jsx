import { useState, useEffect } from 'react';
import { FaWhatsapp, FaArrowUp, FaCheck, FaTimes, FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './HomePlataforma.module.css';

function HomePlataforma() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Monitora a rolagem para exibir o botão de voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

    
  // NOVO: Armazena qual plano está selecionado pelo usuário ('start', 'pro' ou 'evolution')
  const [selectedPlan, setSelectedPlan] = useState('pro');


  // NOVO: Controla qual índice do FAQ está aberto (null significa nenhum aberto)
 

  const toggleFaq = (index) => {
    if (openFaqIndex === index) {
      setOpenFaqIndex(null); // Se clicar na mesma, fecha
    } else {
      setOpenFaqIndex(index); // Abre a selecionada
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* 1. CABEÇALHO (NAVBAR) */}
      <header className={styles.navbar}>
        <div className={styles.logo} onClick={() => navigate(`/`)} style={{ cursor: 'pointer' }}>
          <span>JÁRESERVA</span>
        </div>

        {/* Links de navegação - ganham a classe 'menuOpen' se o menu mobile estiver ativo */}
        <nav className={`${styles.menuLinks} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)}>Funcionalidades</a>
          <a href="#nichos" onClick={() => setIsMenuOpen(false)}>Nichos</a>
          <a href="#planos" onClick={() => setIsMenuOpen(false)}>Planos</a>
          
          {/* Botões visíveis apenas dentro do menu lateral no mobile */}
          <div className={styles.mobileActions}>
            <button className={styles.btnLink} onClick={() => navigate(`/empresa/login`)}>
              Entrar
            </button>
            <button className={styles.primaryInline} onClick={() => navigate('/empresa/nova')}>
              Criar Conta
            </button>
          </div>
        </nav>

        {/* Botões visíveis apenas no computador (Desktop) */}
        <div className={styles.navActionsDesktop}>
          <button className={styles.btnLink} onClick={() => navigate(`/empresa/login`)}>
            Entrar
          </button>
          <button className={styles.primaryInline} onClick={() => navigate('/empresa/nova')}>
            Criar Conta
          </button>
        </div>

        {/* Ícone que alterna entre as Barras (Abrir) e o X (Fechar) no mobile */}
        <button className={styles.menuIcon} onClick={toggleMenu} aria-label="Menu">
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
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
          <button className={styles.primaryHero} onClick={() => navigate('/empresa/nova')}>
            🚀 Cadastrar meu Negócio (Grátis)
          </button>
        </div>
      </section>

      {/* 3. FUNCIONALIDADES DETALHADAS */}
      <section id="funcionalidades" className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.sectionSubtitle}>Recursos Estratégicos</span>
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
      {/* 4. VITRINE DE NICHOS */}
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

      {/* 5. PLANOS E PREÇOS */}
      <section id="planos" className={styles.pricingSection}>
        <div className={styles.pricingHeader}>
          <span className={styles.sectionSubtitle}>Preços Transparentes</span>
          <h2>O plano ideal para o tamanho do seu negócio</h2>
          <p>Comece gratuitamente e mude de plano conforme sua empresa crescer. Sem contratos de fidelidade.</p>
        </div>

                <div className={styles.pricingGrid}>
          {/* 1. Plano Start */}
          <div 
            className={`${styles.priceCard} ${selectedPlan === 'start' ? styles.featuredPlan : ''}`}
            onClick={() => setSelectedPlan('start')}
          >
            {selectedPlan === 'start' && <span className={styles.ribbon}>SELECIONADO</span>}
            <h3>Plano Start</h3>
            <p className={styles.planDescription}>Para profissionais autônomos iniciando.</p>
            <div className={styles.price}>
              <span className={styles.currency}>R\$</span>
              <span className={styles.amount}>19</span>
              <span className={styles.period}>,90/mês</span>
            </div>
            <button 
              className={selectedPlan === 'start' ? styles.primaryPlanBtn : styles.secondaryPlanBtn} 
              onClick={(e) => {
                e.stopPropagation(); // Evita conflito de cliques com o card
                navigate('/empresa/nova');
              }}
            >
              Experimentar Grátis (7 dias)
            </button>
            <ul className={styles.planFeatures}>
              <li><FaCheck className={styles.checkIcon} /> Até 50 agendamentos/mês</li>
              <li><FaCheck className={styles.checkIcon} /> 1 Profissional (Você)</li>
              <li><FaCheck className={styles.checkIcon} /> Link na Bio do Instagram</li>
              <li className={styles.disabledFeature}><FaTimes /> Lembretes por WhatsApp</li>
              <li className={styles.disabledFeature}><FaTimes /> Gestão Financeira Completa</li>
            </ul>
          </div>

          {/* 2. Plano Pro */}
          <div 
            className={`${styles.priceCard} ${selectedPlan === 'pro' ? styles.featuredPlan : ''}`}
            onClick={() => setSelectedPlan('pro')}
          >
            <span className={styles.ribbon}>
              {selectedPlan === 'pro' ? 'SELECIONADO' : 'RECOMENDADO'}
            </span>
            <h3>Plano Pro</h3>
            <p className={styles.planDescription}>Perfeito para negócios e equipes em crescimento.</p>
            <div className={styles.price}>
              <span className={styles.currency}>R\$</span>
              <span className={styles.amount}>79</span>
              <span className={styles.period}>,90/mês</span>
            </div>
            <button 
              className={selectedPlan === 'pro' ? styles.primaryPlanBtn : styles.secondaryPlanBtn} 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/empresa/nova');
              }}
            >
              Experimentar Grátis (7 dias)
            </button>
            <ul className={styles.planFeatures}>
              <li><FaCheck className={styles.checkIcon} /> Agendamentos Ilimitados</li>
              <li><FaCheck className={styles.checkIcon} /> Até 5 Profissionais inclusos</li>
              <li><FaCheck className={styles.checkIcon} /> <strong>Lembretes no WhatsApp</strong></li>
              <li><FaCheck className={styles.checkIcon} /> Gestão Financeira & Comissões</li>
              <li><FaCheck className={styles.checkIcon} /> Bloqueio de Inadimplentes</li>
            </ul>
          </div>

          {/* 3. Plano Evolution */}
          <div 
            className={`${styles.priceCard} ${selectedPlan === 'evolution' ? styles.featuredPlan : ''}`}
            onClick={() => setSelectedPlan('evolution')}
          >
            {selectedPlan === 'evolution' && <span className={styles.ribbon}>SELECIONADO</span>}
            <h3>Plano Evolution</h3>
            <p className={styles.planDescription}>Para clínicas e grandes redes multimarcas.</p>
            <div className={styles.price}>
              <span className={styles.currency}>R\$</span>
              <span className={styles.amount}>149</span>
              <span className={styles.period}>,90/mês</span>
            </div>
            <button 
              className={selectedPlan === 'evolution' ? styles.primaryPlanBtn : styles.secondaryPlanBtn} 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/empresa/nova');
              }}
            >
              Experimentar Grátis (7 dias)
            </button>
            <ul className={styles.planFeatures}>
              <li><FaCheck className={styles.checkIcon} /> Profissionais Ilimitados</li>
              <li><FaCheck className={styles.checkIcon} /> Multi-unidades / Filiais</li>
              <li><FaCheck className={styles.checkIcon} /> Suporte Prioritário VIP</li>
              <li><FaCheck className={styles.checkIcon} /> Disparos em Massa de Campanhas</li>
              <li><FaCheck className={styles.checkIcon} /> API de Integração Própria</li>
            </ul>
          </div>
        </div>

      </section>

            {/* 5.2. SEÇÃO DE GARANTIA INCONDICIONAL */}
      <section className={styles.warrantySection}>
        <div className={styles.warrantyContainer}>
          <div className={styles.warrantyBadgeContainer}>
            {/* Um selo visual que representa os 7 dias de garantia */}
            <div className={styles.warrantyBadge}>
              <span className={styles.badgeNumber}>7</span>
              <span className={styles.badgeText}>DIAS</span>
            </div>
          </div>
          
          <div className={styles.warrantyTextContent}>
            <span className={styles.sectionSubtitle}>Risco Zero Garantido</span>
            <h2>Experimente sem compromisso por 7 dias</h2>
            <p>
              Nós confiamos tanto na transformação que a nossa plataforma vai trazer para o seu negócio 
              que oferecemos uma garantia incondicional. Use todos os recursos, configure sua agenda e 
              teste com seus clientes. 
            </p>
            <p className={styles.warrantyHighlight}>
              Se em até 7 dias você decidir que o sistema não é para você, basta solicitar o cancelamento. 
              Devolvemos 100% do seu dinheiro investido, sem burocracia, sem perguntas e sem letrinhas miúdas.
            </p>
          </div>
        </div>
      </section>

            {/* 5.3. SEÇÃO DE PERGUNTAS FREQUENTES (FAQ) */}
      <section className={styles.faqSection}>
        <div className={styles.faqHeader}>
          <span className={styles.sectionSubtitle}>Dúvidas Frequentes</span>
          <h2>Ainda tem alguma dúvida?</h2>
          <p>Separamos as respostas para as perguntas mais comuns dos nossos clientes.</p>
        </div>

        <div className={styles.faqContainer}>
          {[
            {
              q: "Preciso cadastrar meu cartão de crédito para usar o plano gratuito?",
              a: "Não! O Plano Start é totalmente gratuito e você não precisa inserir nenhuma forma de pagamento para começar a usar. Basta criar sua conta e começar a agendar."
            },
            {
              q: "Como funciona o período de testes de 7 dias do Plano Pro?",
              a: "Você pode experimentar todos os recursos do Plano Pro por 7 dias sem cobranças. Se você decidir que a plataforma não é para você dentro desse período, nenhum valor será cobrado."
            },
            {
              q: "O envio de mensagens por WhatsApp tem custo adicional?",
              a: "No Plano Pro, os lembretes automáticos de confirmação de horários via WhatsApp já estão totalmente inclusos na sua assinatura mensal, sem taxas escondidas por mensagem enviada."
            },
            {
              q: "Posso mudar de plano ou cancelar a qualquer momento?",
              a: "Com certeza! Nossa plataforma funciona sem contratos de fidelidade. Você pode fazer o upgrade, downgrade ou cancelar sua assinatura diretamente pelo seu painel quando quiser."
            },
            {
              q: "Meus funcionários conseguem acessar apenas as agendas deles?",
              a: "Sim! No Plano Pro e Evolution, você pode cadastrar seus colaboradores com permissões individuais. Eles terão acesso apenas aos próprios horários e metas, sem visualizar os dados financeiros da empresa."
            }
          ].map((item, index) => (
            <div 
              key={index} 
              className={`${styles.faqItem} ${openFaqIndex === index ? styles.faqItemOpen : ''}`}
            >
              <button 
                className={styles.faqQuestion} 
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaqIndex === index}
              >
                <span>{item.q}</span>
                <span className={styles.faqIcon}></span>
              </button>
              
              <div className={styles.faqAnswer}>
                <div className={styles.faqAnswerContent}>
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>



            {/* 5.5. RODAPÉ INSTITUCIONAL */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span>JÁRESERVA</span>
            <p>A tecnologia que impulsiona o crescimento do seu negócio local.</p>
          </div>
          
          <div className={styles.footerLinksGrid}>
            <div className={styles.footerColumn}>
              <h4>Navegação</h4>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#nichos">Nichos</a>
              <a href="#planos">Planos</a>
            </div>
            
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <a href="#termos">Termos de Uso</a>
              <a href="#privacidade">Política de Privacidade</a>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} JÁRESERVA. Todos os direitos reservados.</p>
          <p className={styles.footerDeveloper}>Feito com ⚡ focado em alta conversão.</p>
        </div>
      </footer>






      {/* 6. BOTÃO FLUTUANTE DO WHATSAPP */}
      <a 
        href="https://wa.me" 
        className={styles.whatsappFloat} 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label="Contato via WhatsApp"
      >
        <FaWhatsapp size={30} />
      </a>

      {/* 7. BOTÃO VOLTAR AO TOPO INTELIGENTE */}
      <button 
        className={`${styles.scrollTopBtn} ${showScrollTop ? styles.showScroll : ''}`} 
        onClick={scrollToTop} 
        aria-label="Voltar ao topo"
      >
        <FaArrowUp size={20} />
      </button>
    </div>
  );
}

export default HomePlataforma;
