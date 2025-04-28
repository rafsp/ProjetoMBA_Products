async function consultarAPI() {
    const pergunta = document.getElementById('pergunta').value.trim();
    
    if (!pergunta) {
      alert("Por favor, digite uma pergunta!");
      return;
    }
  
    try {
      const response = await fetch('https://c7e1-130-211-119-126.ngrok-free.app/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pergunta: pergunta })
      });
  
      if (!response.ok) {
        throw new Error('Erro na resposta da API: ' + response.statusText);
      }
  
      const data = await response.json();
  
      document.getElementById('resposta').textContent = `
  🔹 Resposta do ChatGPT: ${data.resposta}
  
  🔹 Valor Total da Cesta: R$ ${data.valor_total_cesta}
  🔹 Quantidade de Produtos: ${data.quantidade_produtos}
      `;
    } catch (error) {
      console.error('Erro ao chamar a API:', error);
      document.getElementById('resposta').textContent = 'Erro ao consultar a API. Verifique se o servidor está ativo.';
    }
  }
  