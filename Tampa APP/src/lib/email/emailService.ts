import { supabase } from '@/integrations/supabase/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email via Supabase Edge Function + Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: options,
    });

    if (error) throw error;
    
    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string, 
  userName: string
) {
  return sendEmail({
    to: userEmail,
    subject: '🎉 Bem-vindo ao Tampa APP!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; margin: 0;">Tampa APP</h1>
          <p style="color: #6b7280; margin: 8px 0 0 0;">Food Safety Management System</p>
        </div>
        
        <h2 style="color: #1f2937;">Olá ${userName}! 👋</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Seja bem-vindo ao <strong>Tampa APP</strong>! Estamos muito felizes em tê-lo conosco.
        </p>
        
        <p style="color: #374151; line-height: 1.6;">
          Nossa plataforma foi desenvolvida para ajudar você a gerenciar:
        </p>
        
        <ul style="color: #374151; line-height: 1.8;">
          <li>📦 <strong>Inventário</strong> de produtos e ingredientes</li>
          <li>⏰ <strong>Prazos de validade</strong> e alertas</li>
          <li>📋 <strong>Tarefas de rotina</strong> e checklists</li>
          <li>🏷️ <strong>Etiquetas</strong> e rastreabilidade</li>
          <li>👥 <strong>Equipe</strong> e treinamentos</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_APP_URL || 'https://tampa-app.vercel.app'}" 
             style="background: #ea580c; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Acessar Dashboard
          </a>
        </div>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 30px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Precisa de ajuda?</strong><br>
            Entre em contato com nossa equipe de suporte a qualquer momento.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Tampa APP. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send expiring items alert
 */
export async function sendExpiringItemsAlert(
  userEmail: string,
  userName: string,
  items: Array<{ name: string; daysUntilExpiry: number; location?: string }>
) {
  const itemsList = items
    .map(item => `
      <li style="margin: 12px 0; padding: 12px; background: #fef2f2; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #1f2937;">${item.name}</strong>
            ${item.location ? `<br><span style="color: #6b7280; font-size: 14px;">📍 ${item.location}</span>` : ''}
          </div>
          <div style="text-align: right;">
            <span style="color: ${item.daysUntilExpiry <= 1 ? '#dc2626' : '#ea580c'}; 
                         font-weight: 600; font-size: 16px;">
              ${item.daysUntilExpiry} ${item.daysUntilExpiry === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>
      </li>
    `)
    .join('');

  return sendEmail({
    to: userEmail,
    subject: `⚠️ ${items.length} ${items.length === 1 ? 'item vencendo' : 'itens vencendo'} - Tampa APP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h1 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ Alerta de Validade</h1>
          <p style="color: #991b1b; margin: 0;">Itens próximos do vencimento</p>
        </div>
        
        <p style="color: #374151; margin-top: 24px;">Olá <strong>${userName}</strong>,</p>
        
        <p style="color: #374151; line-height: 1.6;">
          Você tem <strong style="color: #dc2626;">${items.length} ${items.length === 1 ? 'item' : 'itens'}</strong> 
          que ${items.length === 1 ? 'está vencendo' : 'estão vencendo'} em breve:
        </p>
        
        <ul style="list-style: none; padding: 0; margin: 20px 0;">
          ${itemsList}
        </ul>
        
        <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>💡 Recomendação:</strong><br>
            Verifique seu inventário e tome as ações necessárias para evitar desperdícios.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_APP_URL || 'https://tampa-app.vercel.app'}/expiring-soon" 
             style="background: #ea580c; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Ver Itens Vencendo
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Tampa APP. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentEmail(
  userEmail: string,
  userName: string,
  taskTitle: string,
  taskDescription: string | null,
  taskDueDate: string,
  assignedBy: string
) {
  return sendEmail({
    to: userEmail,
    subject: `📋 Nova Tarefa Atribuída: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ea580c; margin: 0 0 8px 0;">📋 Nova Tarefa Atribuída</h1>
        <p style="color: #6b7280; margin: 0;">Tampa APP - Sistema de Gestão</p>
        
        <p style="color: #374151; margin-top: 24px;">Olá <strong>${userName}</strong>,</p>
        
        <p style="color: #374151; line-height: 1.6;">
          Você recebeu uma nova tarefa de <strong>${assignedBy}</strong>:
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin: 0 0 12px 0;">${taskTitle}</h2>
          ${taskDescription ? `<p style="color: #6b7280; margin: 0 0 12px 0; line-height: 1.6;">${taskDescription}</p>` : ''}
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #ea580c; font-weight: 600;">📅 Prazo:</span>
            <span style="color: #374151;">${taskDueDate}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_APP_URL || 'https://tampa-app.vercel.app'}/routine-tasks" 
             style="background: #ea580c; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Ver Tarefa
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Tampa APP. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send certificate expiration reminder
 */
export async function sendCertificateExpirationReminder(
  userEmail: string,
  userName: string,
  certificateName: string,
  daysUntilExpiry: number,
  expiryDate: string
) {
  return sendEmail({
    to: userEmail,
    subject: `📜 Certificado vencendo em ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dia' : 'dias'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h1 style="color: #dc2626; margin: 0 0 8px 0;">📜 Certificado Vencendo</h1>
          <p style="color: #991b1b; margin: 0;">Ação necessária</p>
        </div>
        
        <p style="color: #374151; margin-top: 24px;">Olá <strong>${userName}</strong>,</p>
        
        <p style="color: #374151; line-height: 1.6;">
          Seu certificado está próximo do vencimento:
        </p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin: 0 0 12px 0;">${certificateName}</h2>
          <div style="margin: 8px 0;">
            <span style="color: #dc2626; font-weight: 600; font-size: 18px;">
              ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dia' : 'dias'} restantes
            </span>
          </div>
          <div style="margin: 8px 0;">
            <span style="color: #6b7280;">Vencimento: </span>
            <span style="color: #374151; font-weight: 600;">${expiryDate}</span>
          </div>
        </div>
        
        <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Importante:</strong><br>
            Renove seu certificado o quanto antes para manter sua conformidade.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_APP_URL || 'https://tampa-app.vercel.app'}/people" 
             style="background: #ea580c; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Gerenciar Certificados
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Tampa APP. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  });
}
