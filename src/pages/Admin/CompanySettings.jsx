import { useState, useRef } from 'react';
import { appointmentService } from '../../services/appointmentService';
import styles from './Dashboard.module.css';

export default function CompanySettings({ company, onUpdated }) {
    const [name, setName] = useState(company.name || '');
    const [phone, setPhone] = useState(company.phone || '');
    const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState('');
    const [removeMercadoPagoToken, setRemoveMercadoPagoToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Referências para controlar os inputs de arquivo de forma direta
    const bannerInputRef = useRef(null);
    const logoInputRef = useRef(null);

    // Estados para guardar o link da imagem (ou o preview local antes de salvar)
    const [bannerPreview, setBannerPreview] = useState(company.bannerUrl || null);
    const [logoPreview, setLogoPreview] = useState(company.logoUrl || null);

    // Funções para gerar o preview na tela assim que o usuário escolhe o arquivo
    function handleBannerChange(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            setBannerPreview(URL.createObjectURL(files[0]));
        }
    }

    function handleLogoChange(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            setLogoPreview(URL.createObjectURL(files[0]));
        }
    }
    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setIsSaving(true);
            
            const companyChanges = {
                name,
                phone
            };

            const bannerFile = bannerInputRef.current?.files?.[0];
            if (bannerFile) {
                const uploadResult = await appointmentService.uploadImage(bannerFile);
                companyChanges.bannerUrl = uploadResult.url;
            }

            const logoFile = logoInputRef.current?.files?.[0];
            if (logoFile) {
                const uploadResult = await appointmentService.uploadImage(logoFile);
                companyChanges.logoUrl = uploadResult.url;
            }

            if (mercadoPagoAccessToken.trim()) {
                companyChanges.mercadoPagoAccessToken = mercadoPagoAccessToken.trim();
            } else if (removeMercadoPagoToken) {
                companyChanges.clearMercadoPagoAccessToken = true;
            }

            const response = await appointmentService.updateCompany(company._id, companyChanges);

            onUpdated(response.company);
            setName(response.company.name || '');
            setPhone(response.company.phone || '');
            setBannerPreview(response.company.bannerUrl || null);
            setLogoPreview(response.company.logoUrl || null);
            setMercadoPagoAccessToken('');
            setRemoveMercadoPagoToken(false);
            
            if (bannerInputRef.current) bannerInputRef.current.value = '';
            if (logoInputRef.current) logoInputRef.current.value = '';

            alert('Configurações atualizadas com sucesso!');
        } catch (error) {
            alert(error.message || 'Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section>
            <div className={styles.settingsCard}>
                <h2 className={styles.settingsTitle}>Configurações da Empresa</h2>
                <p className={styles.settingsSubtitle}>
                    Atualize os dados públicos e a identidade visual do estabelecimento.
                </p>

                <form onSubmit={handleSubmit} className={styles.formContainer}>
                    
                    {/* Campo de Upload da Logotipo */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Logotipo do Estabelecimento</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
                            ) : (
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#666' }}>Sem Logo</div>
                            )}
                            <input type="file" accept="image/jpeg,image/png,image/webp" ref={logoInputRef} onChange={handleLogoChange} />
                        </div>
                    </div>

                    {/* Campo de Upload do Banner */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Banner Superior (Tela Inicial)</label>
                        <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {bannerPreview && (
                                <img src={bannerPreview} alt="Banner" style={{ width: '100%', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ddd' }} />
                            )}
                            <input type="file" accept="image/jpeg,image/png,image/webp" ref={bannerInputRef} onChange={handleBannerChange} />
                        </div>
                    </div>

                    {/* Inputs de texto normais */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="company-name">Nome do estabelecimento</label>
                        <input id="company-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={styles.formInput} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="company-phone">Telefone comercial</label>
                        <input id="company-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.formInput} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="mercado-pago-token">Token de acesso do Mercado Pago</label>
                        <input id="mercado-pago-token" type="password" autoComplete="new-password" value={mercadoPagoAccessToken} onChange={(e) => { setMercadoPagoAccessToken(e.target.value); if (e.target.value) setRemoveMercadoPagoToken(false); }} placeholder={company.settings?.mercadoPagoConfigured ? 'Token configurado; informe outro para substituí-lo' : 'Cole aqui o token'} className={styles.formInput} />
                        {company.settings?.mercadoPagoConfigured && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={removeMercadoPagoToken} onChange={(e) => { setRemoveMercadoPagoToken(e.target.checked); if (e.target.checked) setMercadoPagoAccessToken(''); }} />
                                Remover credencial atual
                            </label>
                        )}
                    </div>

                    <button type="submit" disabled={isSaving} className={styles.btnSubmit}>
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </section>
    );
}
