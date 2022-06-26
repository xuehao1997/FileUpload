const uploader = document.getElementById('uploader');
const output = document.getElementById('output');
const progress = document.getElementById('progress');
const button = document.getElementById('button');


function read(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function() {
            resolve(reader.result);
        }

        reader.onerror = reject;
        reader.readAsBinaryString(file);
    })
}

let canceled = false;
// 暂停上传
button.addEventListener('click', () => {
    canceled = true;
});

uploader.addEventListener('change', async (event) => {
    canceled = false;
    const { files } = event.target;
    const [file] = files;
    console.log('file对象', file);
    if (!file) {
        return;
    }

    uploader.value = null;
    const content = await read(file);
    const hash = CryptoJS.MD5(content);
    const { size, name, type } = file;
    progress.max = size;
    const chunkSize = 64 * 1024; // 一次上传64k
    let uploaded = 0; // 记录上传多少
    const local = localStorage.getItem(hash);
    if (local) {
        uploaded = Number(local);
    }

    const breakpoint = 400 * 1024;
    while(uploaded < size) { // 未上传完成
        const chunk = file.slice(uploaded, uploaded + chunkSize, type);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('type', type);
        formData.append('size', size);
        formData.append('file', chunk);
        formData.append('offset', uploaded);
        formData.append('hash', hash);

        try {

            // await axios.post('/api/upload', formData);
            await axios({
                method: 'POST',
                data: formData,
                url: '/api/upload',
                // cancelToken: new axios.CancelToken(function(c) {
                //     canceled = c;
                // })
            });
        } catch(e) {
            console.log('axios发送失败', e);
            output.innerText = '上传失败' + e.message;
        }

        uploaded += chunk.size;
        localStorage.setItem(hash, uploaded);
        progress.value = uploaded;

        // if (uploaded > breakpoint) {
        //     return;
        // }
        if (canceled) {
            console.log('canceled', canceled);
            return;
        }

    }

    output.innerText = '上传成功';
});