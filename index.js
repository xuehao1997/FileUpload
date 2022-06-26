const express = require('express');
// 中间件：统一处理，可以复用。比如用户请求，对用户身份的验证
const uploader = require('express-fileupload'); // 将http请求中的二进制文件放在request的files中
const { extname, resolve } = require('path');
const {
    promises: {
        writeFile,
        appendFile,
    },
    existsSync
} = require('fs');
const app = express();
const port = 3000;

// static中间件帮助处理静态文件
app.use('/', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
    urlencoded: true,
}))
app.use(uploader());
// 创建端口
// app.get('/', (req, res) => {
//     res.send('凯明，你看我启动了一个服务器，是不是很神奇')
// });

// 大文件上传入口
app.post('/api/upload', async (req, res) => {
    const { size, type, name, offset, hash } = req.body; // 用了urlencoded解析的函数
    console.log('文件信息：', size, type, name, offset, hash);
    const { file } = req.files;

    const ext = extname(name); // extname - 用于获取文件路径的扩展部分
    const filename = resolve(__dirname, `./public/${hash}${ext}`);
    console.log('__dirname', __dirname, filename);
    console.log('ext', ext);
    if (offset > 0) {
        if (!existsSync(filename)) {
            res.status(400) // 设置Status Code
                .send({
                    message: '文件不存在',
                });
            return;
        }

        await appendFile(filename, file.data);
        res.send({
            data: 'appended'
        });
        return;
    }

    await writeFile(filename, file.data);
    res.send({
        data: 'created',
    })
});

app.listen(port, () => {
    console.log('server is running at:', port);
})