import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PerfilEstabelecimento.module.css';

export default function PerfilEstabelecimento({ company, services, onSelectService }) {
  const navigate = useNavigate();
  

 
  return (
    <div className={styles.profileWrapper}>
      {/* 🏙️ TOPO PREMIUM: Banner e Capa */}
      <div className={styles.coverBanner}>
        {company?.coverUrl ? (
          <img src={company.coverUrl} alt="Capa" className={styles.coverImage} />
        ) : (
          <div className={styles.coverGradient} />
        )}
      </div>

      {/* 👤 INFOS DO NEGÓCIO: Foto de perfil e Gatilhos de Confiança */}
      <div className={styles.businessHeader}>
        <div className={styles.avatarWrapper}>
          {company?.logo ? (
            <img src={company.logo} alt={company.name} className={styles.logoImage} />
          ) : (
            <div className={styles.logoPlaceholder}>{company?.name?.charAt(0).toUpperCase()}</div>
          )}
        </div>

        <div className={styles.businessMainInfo}>
          <h1 className={styles.businessName}>{company?.name}</h1>
          
          {/* Badges de Prova Social e Urgência */}
          <div className={styles.badgesRow}>
            <span className={styles.badgeRating}>⭐ 4.9 (124 avaliações)</span>
            <span className={styles.badgeStatus}>🟢 Aberto agora</span>
          </div>
          
          <p className={styles.businessAddress}>📍 {company?.address || 'Centro, São Paulo'}</p>
        </div>
      </div>

      {/* 📋 LISTA DE ATENDIMENTOS: Renderiza os serviços direto */}
      <div className={styles.servicesSection}>
        <h2 className={styles.sectionTitle}>Serviços Disponíveis</h2>
        
        {services.length === 0 ? (
          <div className={styles.emptyServices}>Nenhum serviço encontrado.</div>
        ) : (
          <div className={styles.servicesGrid}>
            {services.map(service => (
              <div key={service._id} className={styles.serviceItemCard}>
                <div className={styles.serviceLeft}>
                  <h3>{service.name}</h3>
                  <p className={styles.serviceDescription}>
                    {service.description || 'Atendimento completo realizado por especialistas.'}
                  </p>
                  <div className={styles.serviceMeta}>
                    <span className={styles.metaDuration}>⏱️ {service.durationInMinutes} min</span>
                    <span className={styles.metaPrice}>R\$ {service.price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className={styles.serviceRight}>
                  <button
                    type="button"
                    className={styles.btnDirectBook}
                    onClick={() => onSelectService(service._id)}
                  >
                    Agendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

            {/* 🗺️ RODAPÉ INFORMATIVO */}
      <footer className={styles.profileFooter}>
        <h3>📍 Localização e Contato</h3>
        <p>{company?.address || 'Endereço completo não informado'}</p>
        
        {/* 🌟 RENDERIZAÇÃO DO TELEFONE E WHATSAPP */}
        {company?.phone && (
          <div className={styles.contactBlock}>
            <p className={styles.phoneText}>📞 Telefone: <strong>{company.phone}</strong></p>
            
            <a 
              href={`https://wa.me/{company.phone.replace(/\D/g, '')}`} // Injeta o DDI 55 do Brasil e remove caracteres especiais
              target="_blank" 
              rel="noreferrer" 
              className={styles.btnWhatsapp}
            >
              💬 Chamar no WhatsApp
            </a>
          </div>
        )}
      </footer>

    </div>
  );
}
