import { useState, useRef } from 'react';
import {
  useNavigate,
  useOutletContext
} from 'react-router-dom';

import { appointmentService } from '../../../services/appointmentService.js';
import styles from './CadastroServico.module.css';

function CadastroServico() {
  const { company } = useOutletContext();
  const navigate = useNavigate();

  // Referência correta para acessar o arquivo selecionado nesta tela
  const serviceImageInputRef = useRef(null);

  // Estado para armazenar o preview da imagem localmente
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationInMinutes: 30,
    price: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: '',
    text: ''
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'durationInMinutes' ? parseInt(value, 10) : name === 'price' ? parseFloat(value) : value
    }));
  }

  // Gera uma URL temporária do arquivo para exibir no formulário antes do upload
  function handleImageChange(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImagePreview(URL.createObjectURL(files[0]));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage({
      type: '',
      text: ''
    });

    if (!form.name || !form.durationInMinutes) {
      setMessage({
        type: 'error',
        text: 'Nome e duração são obrigatórios.'
      });
      return;
    }

    try {
      setLoading(true);

      let finalImageUrl = null;

      // Realiza o upload binário direto se houver arquivo selecionado
      if (serviceImageInputRef.current?.files?.length > 0) {
        const imageFile = serviceImageInputRef.current.files[0];

        const uploadResult = await appointmentService.uploadImage(imageFile);
        
        // Armazena a URL retornada pela CDN do Vercel Blob
        finalImageUrl = uploadResult.url;
      }

      // Envia os dados para a API incluindo a URL da imagem salva
      await appointmentService.createService({
        companyId: company._id,
        name: form.name,
        description: form.description,
        durationInMinutes: parseInt(form.durationInMinutes, 10),
        price: parseFloat(form.price),
        imageUrl: finalImageUrl,
        isActive: true
      });

      setMessage({
        type: 'success',
        text: 'Serviço cadastrado com sucesso!'
      });

      setForm({
        name: '',
        description: '',
        durationInMinutes: 30,
        price: 0
      });

      setImagePreview(null);
      if (serviceImageInputRef.current) serviceImageInputRef.current.value = '';

    } catch (error) {
      console.error('Erro ao cadastrar serviço:', error);
      const apiErrorMessage = error.response?.data?.error || error.response?.data?.message || error.message;

      setMessage({
        type: 'error',
        text: apiErrorMessage || 'Não foi possível cadastrar o serviço.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Novo serviço</h1>
        <p>Cadastre um novo serviço para {company?.name}.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          
          {/* Campo de imagem com a referência correta */}
          <div className={styles.field}>
            <label>Imagem do serviço (Opcional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ddd' }} 
                />
              )}
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                ref={serviceImageInputRef} 
                onChange={handleImageChange} 
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="name">Nome do serviço</label>
            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Ex.: Corte de cabelo" />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Descrição</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Descreva o serviço (opcional)" rows="4" />
          </div>

          <div className={styles.field}>
            <label htmlFor="durationInMinutes">Duração (em minutos)</label>
            <input id="durationInMinutes" name="durationInMinutes" type="number" min="15" step="15" value={form.durationInMinutes} onChange={handleChange} placeholder="30" />
          </div>

          <div className={styles.field}>
            <label htmlFor="price">Preço</label>
            <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
          </div>

          {message.text && (
            <div className={message.type === 'error' ? styles.error : styles.success}>
              {message.text}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => navigate(-1)}>
              Voltar
            </button>
            <button type="submit" className={styles.primary} disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroServico;
