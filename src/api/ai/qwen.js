const axios = require('axios');
const crypto = require('crypto');

class Qwen {
    constructor({ email, password }) {
        if (!email) throw new Error('Email is required.');
        if (!password) throw new Error('Password is required.');
        
        this.api = axios.create({
            baseURL: 'https://chat.qwen.ai/api',
            headers: {
                'Bx-V': '2.5.31',
                'Connection': 'keep-alive',
                'Host': 'chat.qwen.ai',
                'Origin': 'https://chat.qwen.ai',
                'Referer': 'https://chat.qwen.ai/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                'Version': '0.0.230',
                'X-Request-Id': crypto.randomUUID()
            }
        });
        this.types = {
            chat: 't2t',
            search: 'search',
            thinking: 'think'
        };
        this.token = '';
        this.expiresAt = 0;
        this.email = email;
        this.password = password;
        this.isInitialized = false;
    }
    
    isTokenExpired() {
        return !this.token || Date.now() / 1000 >= this.expiresAt - 300;
    }
    
    async refreshToken() {
        try {
            const { data } = await this.api.get('/v1/auths', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (data.token && data.expires_at) {
                this.token = data.token;
                this.expiresAt = data.expires_at;
                return data;
            }
        } catch (error) {
            await this.login();
        }
    }
    
    async ensureValidToken() {
        if (!this.isInitialized) {
            await this.login();
            this.isInitialized = true;
        } else if (this.isTokenExpired()) {
            await this.refreshToken();
        }
    }
    
    async login() {
        try {
            const { data } = await this.api.post('/v1/auths/signin', {
                email: this.email,
                password: crypto.createHash('sha256').update(this.password).digest('hex')
            });
            
            this.token = data.token;
            this.expiresAt = data.expires_at;
            
            return data;
        } catch (error) {
            throw new Error(`Failed to login: ${error.message}.`);
        }
    }
    
    async models() {
        try {
            await this.ensureValidToken();
            
            const { data } = await this.api.get('/models', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return data.data.map(model => {
                const abilities = model.info.meta.abilities || {};
                const chatTypes = model.info.meta.chat_type || [];
                
                return {
                    id: model.id,
                    thinking: abilities.thinking === 1 || abilities.thinking === 4 || false,
                    search: chatTypes.includes('search'),
                    vision: abilities.vision === 1 || false
                };
            });
        } catch (error) {
            throw new Error(`Failed to get models: ${error.message}.`);
        }
    }
    
    async setInstruction(prompt) {
        try {
            await this.ensureValidToken();
            if (!prompt) throw new Error('Prompt is required.');
            
            const { data } = await this.api.post('/v2/users/user/settings/update', {
                personalization: {
                    name: '',
                    description: '',
                    style: '',
                    instruction: prompt,
                    enable_for_new_chat: true
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(`Failed to set instruction: ${error.message}.`);
        }
    }
    
    async newChat({ model = 'qwen3-max' } = {}) {
        try {
            await this.ensureValidToken();
            
            const models = await this.models();
            if (!models.map(m => m.id).includes(model)) throw new Error('Model not found.');
            
            const { data } = await this.api.post('/v2/chats/new', {
                title: 'New Chat',
                models: [model],
                chat_mode: 'normal',
                chat_type: 't2t',
                timestamp: Date.now()
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return data.data.id;
        } catch (error) {
            throw new Error(`Failed to create new chat: ${error.message}.`);
        }
    }
    
    async loadChat(chatId) {
        try {
            await this.ensureValidToken();
            
            if (!chatId) throw new Error('Chat id is required.');
            
            const { data } = await this.api.get(`/v2/chats/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(`Failed to load chat: ${error.message}.`);
        }
    }
    
    async deleteChat(chatId) {
        try {
            await this.ensureValidToken();
            
            if (!chatId) throw new Error('Chat id is required.');
            
            const { data } = await this.api.delete(`/v2/chats/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return data.data;
        } catch (error) {
            throw new Error(`Failed to delete chat: ${error.message}.`);
        }
    }
    
    async chat(question, { instruction = null, model = 'qwen3-max', type = 'chat', chatId = null } = {}) {
        try {
            await this.ensureValidToken();
            
            if (!question) throw new Error('Question is required.');
            
            const models = await this.models();
            if (!models.map(m => m.id).includes(model)) throw new Error('Model not found.');
            if (type === 'search' && !models.find(m => model === m.id).search) throw new Error('Search is not supported by the model.');
            if (type === 'thinking' && !models.find(m => model === m.id).thinking) throw new Error('Thinking is not supported by the model.');
            if (!this.types[type]) throw new Error('Type not found.');
            
            let parent = null;
            if (chatId) {
                const chatInfo = await this.loadChat(chatId);
                parent = chatInfo.currentId;
            } else {
                chatId = await this.newChat({ model });
            }
            
            if (instruction) await this.setInstruction(instruction);
            
            const { data } = await this.api.post('/v2/chat/completions', {
                stream: true,
                incremental_output: true,
                chat_id: chatId,
                chat_mode: 'normal',
                model: model,
                parent_id: parent,
                messages: [
                    {
                        fid: crypto.randomUUID(),
                        parentId: parent,
                        childrenIds: [crypto.randomUUID()],
                        role: 'user',
                        content: question,
                        user_action: 'chat',
                        files: [],
                        timestamp: Date.now(),
                        models: [model],
                        chat_type: this.types[type],
                        feature_config: {
                            thinking_enabled: type === 'thinking',
                            output_schema: 'phase'
                        },
                        extra: {
                            meta: {
                                subChatType: this.types[type]
                            }
                        },
                        sub_chat_type: this.types[type],
                        parent_id: parent
                    }
                ],
                timestamp: Date.now()
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                params: {
                    chat_id: chatId
                }
            });
            
            const lines = data.split('\n\n').filter(l => l.trim()).map(l => JSON.parse(l.substring(6)));
            const res = {
                chatId: null,
                response: {
                    reasoning: '',
                    content: '',
                    web_search: []
                },
                timestamp: new Date().toISOString()
            };
            
            lines.forEach(l => {
                if (l?.['response.created']?.chat_id) res.chatId = l['response.created'].chat_id;
                const d = l?.choices?.[0]?.delta;
                if (d?.phase === 'think' && d.content) res.response.reasoning += d.content;
                if (d?.phase === 'answer' && d.content) res.response.content += d.content;
                if (d?.phase === 'web_search' && d.extra?.web_search_info) res.response.web_search = d.extra.web_search_info;
            });
            
            return res;
        } catch (error) {
            throw new Error(`Failed to chat: ${error.message}.`);
        }
    }
}

// Environment variables for credentials
const QWEN_EMAIL = process.env.QWEN_EMAIL || 'your_email@gmail.com';
const QWEN_PASSWORD = process.env.QWEN_PASSWORD || 'your_password';

// Initialize Qwen instance
let qwenInstance = null;

async function getQwenInstance() {
    if (!qwenInstance) {
        qwenInstance = new Qwen({
            email: QWEN_EMAIL,
            password: QWEN_PASSWORD
        });
        await qwenInstance.login();
    }
    return qwenInstance;
}

module.exports = function(app) {
    app.get('/ai/qwen', async (req, res) => {
        try {
            const { 
                question, 
                instruction = null, 
                model = 'qwen3-max', 
                type = 'chat', 
                chatId = null,
                apikey 
            } = req.query;
            
            if (!question) {
                return res.status(400).json({
                    status: 400,
                    error: 'Question parameter required',
                    message: 'Please provide a question using the question parameter'
                });
            }

            const qwen = await getQwenInstance();
            const result = await qwen.chat(question, {
                instruction,
                model,
                type,
                chatId
            });
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: result
            });
            
        } catch (error) {
            console.error('Qwen AI Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Qwen AI request failed',
                message: error.message
            });
        }
    });

    // Additional endpoint to get available models
    app.get('/ai/qwen/models', async (req, res) => {
        try {
            const { apikey } = req.query;
            
            const qwen = await getQwenInstance();
            const models = await qwen.models();
            
            res.json({
                status: 200,
                creator: "@Terri",
                data: models
            });
            
        } catch (error) {
            console.error('Qwen Models Error:', error);
            res.status(500).json({
                status: 500,
                error: 'Failed to get models',
                message: error.message
            });
        }
    });
};