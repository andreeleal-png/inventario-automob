# Inventário Automob: como colocar no ar

O app roda como um link do Google (Apps Script) na sua conta. As fotos vão para uma pasta do seu Google Drive e cada foto vira uma linha na planilha "Inventário Automob", que baixa como Excel. O acesso é por usuário e senha.

## Atualizar para a versão com login (você já tem o app no ar)

1. Abra o projeto "Inventário Automob" em https://script.google.com.
2. No `Código.gs`: Ctrl+A, Delete, e cole o **Code.gs** novo inteiro (primeira linha `/**`, última `}`).
3. No `Index.html`: Ctrl+A, Delete, e cole o **Index.html** novo inteiro (última linha `</html>`).
4. Ctrl+S, escolha a função **configurar** e clique em **Executar**. Autorize de novo se o Google pedir.
5. No **Registro de execução** aparece a linha `PRIMEIRO ACESSO >> usuário: admin   senha provisória: xxxxxxxxxx`. Anote essa senha.
6. **Implantar > Gerenciar implantações >** lápis **> Versão: Nova versão > Implantar**. O link continua o mesmo.
7. Abra o link, entre com `admin` e a senha provisória e crie a sua senha.

O `configurar` só acrescenta coisas: as fotos já registradas continuam na planilha, e ela ganha as abas **Lojas** (com as 147 filiais) e **Usuários**.

## Instalação do zero (se ainda não tiver o projeto)

1. Em https://script.google.com, clique em **Novo projeto** e dê o nome "Inventário Automob".
2. Apague o conteúdo de `Código.gs` e cole o **Code.gs**.
3. **+ > HTML**, chame de `Index` e cole o **Index.html**.
4. Em **Serviços**, clique no **+**, escolha **Drive API** e depois **Adicionar**.
5. Faça os passos 4 a 7 da seção acima, mas no passo 6 use **Implantar > Nova implantação > App da Web**, com "Executar como: **Eu**" e "Quem pode acessar: **Qualquer pessoa**". Mesmo assim, só entra quem tem usuário e senha.

## Perfis de acesso

| | Loja | Admin |
|---|---|---|
| Fotografar | Só na loja do cadastro | Escolhe a loja no topo do app |
| Consultar fotos | Só as da própria loja | Todas, com filtro por loja |
| Cadastrar usuários | Não | Sim (aba Usuários do app) |
| Baixar Excel, planilha e pasta | Não | Sim |

- **Criar o acesso de um realizador de inventário:** no app, abra **Usuários > Novo usuário** e preencha login, nome, perfil Loja, a filial e uma senha provisória. Passe o login e a senha para a pessoa: no primeiro acesso ela troca a senha.
- **Bloquear alguém:** abra o usuário e desmarque "Acesso ativo". A pessoa é desconectada na hora.
- **Esqueceu a senha:** o admin abre o usuário e define uma nova senha provisória.
- **Perdeu a senha do admin:** no editor do Apps Script, rode a função `redefinirSenhaAdmin` e veja a nova senha no registro de execução.
- **Filiais:** ficam na aba **Lojas** da planilha (Código, Loja, Bandeira, Ativa). Para incluir uma filial, acrescente uma linha. Colocar "Não" na coluna Ativa esconde a filial do app.
- O botão **Baixar Excel** usa a sua conta Google. Se outro admin precisar baixar, compartilhe a planilha com o e-mail dele.

## No celular

- Abra o link no Chrome (Android) ou no Safari (iPhone) e permita **localização** e **câmera**.
- Para usar como app: menu do navegador > **Adicionar à tela inicial**.
- O login fica salvo por 7 dias. Sem internet, a pessoa continua fotografando e as fotos são enviadas sozinhas quando o sinal voltar.

## Onde ficam os dados

- **Planilha "Inventário Automob"**
  - Aba **Fotos**: data/hora, placa, loja, código da loja, responsável, usuário, endereço, coordenadas, código da foto, link da foto e se a placa foi digitada à mão.
  - Aba **Resumo**: fotos por loja e por dia.
  - Aba **Lojas**: as filiais.
  - Aba **Usuários**: os acessos. As senhas ficam criptografadas, nunca em texto.
- **Pasta "Inventário Automob - Fotos"** no Drive, separada por loja e por dia. A subpasta `_miniaturas` guarda as versões pequenas usadas na tela de consulta.
