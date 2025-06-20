import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://fqshqdfhmptuvjskptzl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxc2hxZGZobXB0dXZqc2twdHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NzcxNzEsImV4cCI6MjA2MjA1MzE3MX0.YuDcyfe8v6ff4Y88GuNjDV-CsLz_k1AM4c49ozk-RdY'
)

window.procurar = async function () {
  const frase = document.getElementById('fraseInput').value.toLowerCase();
  const resultadosDiv = document.getElementById('resultados');
  resultadosDiv.innerHTML = 'A procurar...';

  const dataRegex = /dia\s(\d{1,2})\sde\s(\w+)/i;
  const horaRegex = /às\s(\d{1,2})h/i;
  const tipoRegex = /(eletricistas?|canalizadores?|carpinteiros?|limpeza)/i;

  const meses = {
    janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
  };

  const [_, dia, mes] = frase.match(dataRegex) || [];
  const [__, hora] = frase.match(horaRegex) || [];
  const [___, tipo] = frase.match(tipoRegex) || [];

  if (!dia || !mes || !hora || !tipo) {
    resultadosDiv.innerHTML = 'Frase incompleta ou mal interpretada. Ex: "Quero um eletricista no dia 12 de maio às 15h".';
    return;
  }

  const especialidadesMap = {
    eletricistas: 'eletricidade',
    canalizadores: 'canalizacao',
    carpinteiros: 'carpintaria',
    limpeza: 'limpeza'
  };

  const especialidadeFinal = especialidadesMap[tipo];
  if (!especialidadeFinal) {
    resultadosDiv.innerHTML = 'Especialidade não reconhecida.';
    return;
  }

  const dataObj = new Date(2025, meses[mes], parseInt(dia));
  const dataISO = dataObj.toISOString().split('T')[0];
  const horaFormatada = `${hora.padStart(2, '0')}:00`;

  const { data: profissionais, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('especialidade', especialidadeFinal)
    .eq('aprovado', true);

  if (error) {
    resultadosDiv.innerHTML = 'Erro ao procurar profissionais.';
    console.error(error);
    return;
  }

  const disponiveis = [];

  for (let prof of profissionais) {
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', prof.id)
      .eq('data', dataISO)
      .eq('hora_inicio', horaFormatada)
      .neq('estado', 'rejeitada');

    if (!agendamentos || agendamentos.length === 0) {
      disponiveis.push(prof);
    }
  }

  if (disponiveis.length === 0) {
    resultadosDiv.innerHTML = 'Nenhum profissional disponível.';
  } else {
    resultadosDiv.innerHTML = `<h3>Profissionais disponíveis:</h3><ul>` +
      disponiveis.map(p => `<li>${p.nome} ${p.apelido} - ${p.especialidade}</li>`).join('') +
      `</ul>`;
  }
}
