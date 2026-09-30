import { useState } from 'react';
import { appointmentService } from '../../services/appointmentService';
import styles from './Dashboard.module.css';

export default function CompanySettings({ company, onUpdated }) {
    const [name, setName] = useState(company.name || '');
    const [phone, setPhone] = useState(company.phone || '');
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setIsSaving(true);
            const response = await appointmentService.updateCompany(company._id, {
                name,
                phone
            });

            onUpdated(response.company);
            setName(response.company.name || '');
            setPhone(response.company.phone || '');
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
                    Atualize os dados públicos do estabelecimento.
                </p>

                <form onSubmit={handleSubmit} className={styles.formContainer}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="company-name">
                            Nome do estabelecimento
                        </label>
                        <input
                            id="company-name"
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel} htmlFor="company-phone">
                            Telefone comercial
                        </label>
                        <input
                            id="company-phone"
                            type="tel"
                            required
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className={styles.btnSubmit}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </section>
    );
}