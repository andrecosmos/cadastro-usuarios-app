// src/utils/whatsappHelper.js

/**
 * Gera o link do WhatsApp para envio de confirmação de agendamento.
 * @param {Object} agendamento - Dados do agendamento (servico, profissional, data, horario, telefoneCliente, nomeCliente)
 * @param {Object} empresa - Dados da empresa (name)
 * @param {string} tipoFluxo - 'cliente' para o próprio cliente salvar, 'admin' para o barbeiro enviar
 */
export function gerarLinkWhatsApp(agendamento, empresa, tipoFluxo = 'cliente') {
  if (!agendamento || !empresa) return '';

  const { servico, profissional, data, horario, telefoneCliente, nomeCliente } = agendamento;
  const nomeEmpresa = empresa.name || 'Estabelecimento';
  
  // Limpa o telefone do cliente (independente de quem está clicando, a mensagem vai para o cliente)
  let telefoneLimpo = (telefoneCliente || '').replace(/\D/g, '');
  if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
    telefoneLimpo = `55${telefoneLimpo}`;
  }
  if (telefoneLimpo.length < 12 || telefoneLimpo.length > 15) return '';
  
  // Formata a data de yyyy-MM-dd para dd/mm/yyyy se necessário
  const dataFormatada = data.includes('-') 
    ? data.split('-').reverse().join('/') 
    : data;

  let texto = '';

  // Centraliza as mensagens de acordo com a tela que chamou
  if (tipoFluxo === 'admin') {
    // Texto que o Admin envia PARA o cliente
    texto = `Olá, ${nomeCliente || 'Cliente'}! 👋\n\n` +
            `Seu agendamento na *${nomeEmpresa}* foi realizado com sucesso! 🎉\n\n` + 
            `💇‍♂️ *Serviço:* ${servico}\n` + 
            `👤 *Profissional:* ${profissional}\n` + 
            `📆 *Data:* ${dataFormatada}\n` + 
            `⏰ *Horário:* ${horario}\n\n` + 
            `Te esperamos lá!`;
  } else {
    // Texto que o próprio Cliente envia para SI MESMO salvar
    texto = `📅 *Meu Agendamento Confirmado!* 📅\n\n` + 
            `Olá! Meu agendamento na *${nomeEmpresa}* foi concluído:\n\n` + 
            `💇‍♂️ *Serviço:* ${servico}\n` + 
            `👤 *Profissional:* ${profissional}\n` + 
            `📆 *Data:* ${dataFormatada}\n` + 
            `⏰ *Horário:* ${horario}\n\n` + 
            `_Salvo automaticamente via sistema de agendamento._`;
  }

  const textoCodificado = encodeURIComponent(texto);
  
  return `https://wa.me/${telefoneLimpo}?text=${textoCodificado}`;
}
