## 前提条件

在使用SDK前，请先阅读接口说明，详情请参见[接口说明](https://help.aliyun.com/zh/isi/developer-reference/overview-of-speech-synthesis#topic-2572243)。

## 下载安装

**说明**

-   SDK支持nodev14及以上版本。
    
-   请确认已经安装nodejs&npm环境，并完成基本配置。
    

1.  下载并安装SDK。
    
    通过以下命令完成SDK下载和安装。
    
    ```nodejs
    npm install alibabacloud-nls
    ```
    
2.  导入SDK。
    
    在代码中使用require或者import导入SDK。
    
    ```nodejs
    const Nls = require('alibabacloud-nls') //Nls内部含SpeechRecognition, SpeechTranscription, SpeechSynthesizer //以下为使用import导入SDK //import { SpeechRecognition } from "alibabacloud-nls" //import { SpeechTranscription } from "alibabacloud-nls" //import { SpeechSynthesizer } from "alibabacloud-nls"
    ```
    

## 关键接口和参数描述

Node.js中，实现语音合成的功能，围绕`SpeechSynthesizer`类进行，一般按照如下步骤编写代码（步骤2和步骤3顺序可互换）：

1.  创建`SpeechSynthesizer`实例，此时会传入语音合成服务地址和认证信息。
    
2.  设置语音合成的发音人、采样率、音频格式等属性：创建属性对象或者修改`SpeechSynthesizer`实例的`defaultStartParams`方法返回的默认属性对象。
    
3.  补充`SpeechSynthesizer`实例的回调函数`on`的细节（观察者模式——当连接成功建立、合成语音、发生异常等时，服务器会通过回调`on`函数通知客户端）。
    
4.  调用`SpeechSynthesizer`实例的`start`函数开始语音合成。
    

### 1\. `SpeechSynthesizer`类

`SpeechSynthesizer`类用于语音合成。

`SpeechSynthesizer`的构造函数参数说明如下：

<table id="50174fa6a0y4j" tablewidth="709" tablecolswidth="177 177 355" autofit="false"><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="1.5*"></colgroup><tbody><tr id="8e145a7f05zyd"><td id="ecc6b0dd79183" rowspan="1" colspan="1"><p id="43da36c1b4kcg"><b>参数</b></p></td><td id="2e331377ecipt" rowspan="1" colspan="1"><p id="e613cd2883aus"><b>类型</b></p></td><td id="e5f7e31161ice" rowspan="1" colspan="1"><p id="d62697577etlt"><b>参数说明</b></p></td></tr><tr id="e21f7fa0d8hsp"><td id="c8640f9d25129" rowspan="1" colspan="1"><p id="a164d413d6e7f">config</p></td><td id="909a71926cp0u" rowspan="1" colspan="1"><p id="39672f1d8b8cq">Object</p></td><td id="41e898d91fjvj" rowspan="1" colspan="1"><p id="4ab022e0fetrp">连接配置对象。</p></td></tr></tbody></table>

config参数说明：

<table id="747d93859bhwa" tablewidth="709" tablecolswidth="177 177 355" autofit="false"><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="1.5*"></colgroup><tbody><tr id="0f7c903d4el9t"><td id="347b65610chnn" rowspan="1" colspan="1"><p id="9d469955b3vew"><b>参数</b></p></td><td id="46de206ccdbct" rowspan="1" colspan="1"><p id="ea0f524d5e6ck"><b>类型</b></p></td><td id="4246161ca0024" rowspan="1" colspan="1"><p id="257e2d4fe7htb"><b>参数说明</b></p></td></tr><tr id="2d7dafc25482c"><td id="f1353f4416wdo" rowspan="1" colspan="1"><p id="0d5ce27a4d1vn">url</p></td><td id="45d324ad68gxe" rowspan="1" colspan="1"><p id="ea1f459b61nxy">String</p></td><td id="bcf903be89jur" rowspan="1" colspan="1"><p id="1a572e22b349d">语音合成服务地址。默认值为<span></span>wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1。</p><p jc="left" id="74c08a4705xl4">您需要配置符合自己实际情况的地址，参见<a href="https://help.aliyun.com/zh/isi/developer-reference/overview-of-speech-synthesis#section-nme-tcl-xuc" id="072ac0339a44u" title="">服务地址</a>进行获取。</p></td></tr><tr id="adc1ed6274nyj"><td id="e74fae5034izy" rowspan="1" colspan="1"><p id="8c8027fa91bj9">token</p></td><td id="8a6adacbf67id" rowspan="1" colspan="1"><p id="349dd27407bqi">String</p></td><td id="c6b3210ccdsdt" rowspan="1" colspan="1"><p id="18b4403f68q6q">访问<span></span>Token，详情可参见<a href="https://help.aliyun.com/zh/isi/overview-of-obtaining-an-access-token#587dee8029x7r" id="7b92abef7883l" title="">获取<span></span>Token<span></span>概述</a>。</p></td></tr><tr id="43e7bb696cfe5"><td id="581ebd34bajfu" rowspan="1" colspan="1"><p id="847df19d14p9k">appkey</p></td><td id="25d48e5391w7n" rowspan="1" colspan="1"><p id="12aea525626ja">String</p></td><td id="f000f4a9eb6ae" rowspan="1" colspan="1"><p id="b7e69f1b58al5">对应项目<span></span>Appkey。</p></td></tr></tbody></table>

示例：

```nodejs
let tts = new Nls.SpeechSynthesizer({ url: URL, appkey: APPKEY, token: TOKEN })
```

### **2\. 设置语音合成的发音人、采样率、音频格式等属性**

可以基于`SpeechSynthesizer`实例的`defaultStartParams`方法返回的默认属性对象进行设置，也可以自定义一个属性对象。该属性对象在调用`SpeechSynthesizer`实例的`start`函数时需要传入。

参数说明：

<table id="01464ce1e3h2r" tablewidth="710" tablecolswidth="142 142 142 284" autofit="false"><colgroup colwidth="0.8*"></colgroup><colgroup colwidth="0.8*"></colgroup><colgroup colwidth="0.8*"></colgroup><colgroup colwidth="1.6*"></colgroup><tbody><tr id="c81af98c4044d"><td id="d4f88dee8ev2v" rowspan="1" colspan="1"><p id="54f382d9cdn1r"><b>参数</b></p></td><td id="8671e4d816i3h" rowspan="1" colspan="1"><p id="bc32b50306dka"><b>类型</b></p></td><td id="a9c78780adagn" rowspan="1" colspan="1"><p id="35e60d2dcd568"><b>是否必需</b></p></td><td id="58db7acf29l23" rowspan="1" colspan="1"><p id="f3836749b81ju"><b>说明</b></p></td></tr><tr id="966a5164c5den"><td id="460974ae60htk" rowspan="1" colspan="1"><p id="f5a8f9fe6b1la">text</p></td><td id="abdecb82bch57" rowspan="1" colspan="1"><p id="a3085261e0v6h">String</p></td><td id="edb47c506au9i" rowspan="1" colspan="1"><p id="7700482670s27">是</p></td><td id="dc7c76f76bksb" rowspan="1" colspan="1"><p id="703e0ea4c7wgy">待合成文本，文本内容必须采用<span></span>UTF-8<span></span>编码，长度不超过<span></span>300<span></span>个字符（英文字母之间需要添加空格）。</p><div type="note" id="467c056aa323w" docid="4891773"><p><strong>说明</strong></p><div><p id="475cbe24d244v">调用某音色的多情感内容，需要在<span></span>text<span></span>中加上<span></span>ssml-emotion<span></span>标签，详情请参见<a href="https://help.aliyun.com/zh/isi/developer-reference/ssml-overview#title-i3w-j10-5yw" id="affd617760swb" title="">&lt;emotion&gt;</a>。</p><p id="b6eb8df10afrc">只有支持多情感的音色，才能使用&lt;emotion&gt;标签，否则会报错：Illegal ssml text。</p></div></div></td></tr><tr id="69c414144fg5y"><td id="8af9c77612on3" rowspan="1" colspan="1"><p id="da899510a0cla">voice</p></td><td id="a4b80d0afchwr" rowspan="1" colspan="1"><p id="69047e44f2b8v">String</p></td><td id="c4436c0de09vz" rowspan="1" colspan="1"><p id="6273dae7a4s4v">否</p></td><td id="ada6b045954rp" rowspan="1" colspan="1"><p id="7e1c4f1ec1425">发音人，默认是<code data-tag="code" code-type="xCode">xiaoyun</code>。</p></td></tr><tr id="6ea431f520n7a"><td id="7474d5d3491c9" rowspan="1" colspan="1"><p id="7d29263e2euu5">format</p></td><td id="3659cdd4f3bth" rowspan="1" colspan="1"><p id="c90ec1bdfc4yh">String</p></td><td id="66b15cb3665k6" rowspan="1" colspan="1"><p id="d0b154e8f8pdu">否</p></td><td id="d31179fa456i5" rowspan="1" colspan="1"><p id="87692c6f6ek7m">音频编码格式，支持.pcm、.wav<span></span>和.mp3<span></span>格式。默认值：<code data-tag="code" code-type="xCode">pcm</code>。</p></td></tr><tr id="fd736960f3bkp"><td id="4602711d1b8es" rowspan="1" colspan="1"><p id="784e1b13b4y6l">sample_rate</p></td><td id="eaf8d53fbb0kp" rowspan="1" colspan="1"><p id="3bea1d488a8it">Integer</p></td><td id="628b4c62398r1" rowspan="1" colspan="1"><p id="65d9164bae6q5">否</p></td><td id="9f1945e476xeg" rowspan="1" colspan="1"><p id="c76439f6a18s6">音频采样率，默认值：16000 Hz。</p></td></tr><tr id="0241304b5d9y2"><td id="987b64f36f1y5" rowspan="1" colspan="1"><p id="34f44665689ps">volume</p></td><td id="85ccc0a5b57ob" rowspan="1" colspan="1"><p id="5a939038222x1">Integer</p></td><td id="1bcab6cabdym4" rowspan="1" colspan="1"><p id="06f16c8d32et5">否</p></td><td id="2d9d1309f53x6" rowspan="1" colspan="1"><p id="a70f3efbcbp9r">音量，取值范围：0～100。默认值：50。</p></td></tr><tr id="aa32fa16904vr"><td id="62d8004488jyt" rowspan="1" colspan="1"><p id="fe5c01a72b2n9">speech_rate</p></td><td id="77cf52e2cau1i" rowspan="1" colspan="1"><p id="9df5f3182eotq">Integer</p></td><td id="85d145ad2bwgd" rowspan="1" colspan="1"><p id="ae6c379fc5re1">否</p></td><td id="6aec9648918zd" rowspan="1" colspan="1"><p id="bee91714b0s33">语速，取值范围：-500～500，默认值：0。</p><p id="89761f44cauhs">[-500, 0, 500] 对应的语速倍速区间为 [0.5, 1.0, 2.0]。</p><ul id="4baebd0aef74r"><li id="a88212e74fqcf"><p id="03e049eb28tmb">-500<span></span>表示默认语速的<span></span>0.5<span></span>倍速。</p></li><li id="b677a896e5w0n"><p id="b346e25c61ct3">0<span></span>表示默认语速的<span></span>1<span></span>倍速。1<span></span>倍速是指模型默认输出的合成语速，语速会依据每一个发音人略有不同，大概每秒钟<span></span>4<span></span>个字左右。</p></li><li id="315d1325b4qyu"><p id="8086655f75oas">500<span></span>表示默认语速的<span></span>2<span></span>倍速。</p></li></ul><p id="8153f30bc767a">计算方法如下：</p><ul id="582315d062sms"><li id="23b253f24fw8a"><p id="cb3689278chnt">0.8<span></span>倍速（1-1/0.8）/0.002 = -125</p></li><li id="dbcbbebd22pfj"><p id="f96309f2d72o4">1.2<span></span>倍速（1-1/1.2）/0.001 = 166</p></li></ul><p id="16c5a0f709wbe"><b>说明</b></p><ul id="83a6fb677fph9"><li id="73c0830dcdp0c"><p id="9691ea8969wuj">小于<span></span>1<span></span>倍速时，使用<span></span>0.002<span></span>系数。</p></li><li id="bdce0f3f74h3k"><p id="bce812a35096u">大于<span></span>1<span></span>倍速时，使用<span></span>0.001<span></span>系数。</p></li></ul><p id="aacdc6de55fvr">实际算法结果取近似值。</p></td></tr><tr id="0561724f72k6p"><td id="23ac77b1c3cpx" rowspan="1" colspan="1"><p id="0fb76640467u4">pitch_rate</p></td><td id="b91024ae32yna" rowspan="1" colspan="1"><p id="7f4496d4e1ksu">Integer</p></td><td id="73d546ce3eoyr" rowspan="1" colspan="1"><p id="6ef7f9d571m2g">否</p></td><td id="5a1781f99dxhz" rowspan="1" colspan="1"><p id="0079269b46ms5">语调，取值范围：-500～500，默认值：0。</p></td></tr><tr id="c7d923b38dnyo"><td id="4804cfb8d6any" rowspan="1" colspan="1"><p id="3ac1c3cc05h9o">enable_subtitle</p></td><td id="dfd6207c09kxw" rowspan="1" colspan="1"><p id="c659f65657ntd">Boolean</p></td><td id="60348dd927bjs" rowspan="1" colspan="1"><p id="88adddffa3b30">否</p></td><td id="c837f477215ul" rowspan="1" colspan="1"><p id="c039cd6e8be5x">开启字级别时间戳。更多使用方法，请参见<a href="https://help.aliyun.com/zh/isi/developer-reference/timestamp-feature" id="a6907a0031kgt" title="">语音合成时间戳功能介绍</a>。</p></td></tr></tbody></table>

基于defaultStartParams返回的默认属性进行设置

自定义属性对象

`defaultStartParams`函数返回一个对象：

```nodejs
{ voice: voice, // voice的值为调用函数时传入的参数 format: "wav", sample_rate: 16000, volume: 50, speech_rate: 0, pitch_rate: 0, enable_subtitle: false }
```

可对该对象重新设置，例如：

```nodejs
let param = tts.defaultStartParams(); // 待合成文本 param.text = "举头望明月，低头思故乡"; // 发音人 param.voice = "aixia"; // 语调，范围是-500~500，可选，默认是0 // param.pitch_rate = 100; // 语速，范围是-500~500，默认是0 // param.speech_rate = 100; // 设置返回音频的编码格式 // param.format = "wav"; // 设置返回音频的采样率 // param.sample_rate = 16000; // 是否开启字级别时间戳 // param.enable_subtitle = true;
```

### **3\. 回调函数**`**on**`

`on`函数源码如下：

```nodejs
on(which, handler) { this._event.on(which, handler) }
```

语音合成任务开启后，服务端会回调该函数，将语音合成过程中的一些信息返回给客户端。

<table id="f64c610006zoe" tablewidth="709" tablecolswidth="177 177 355" autofit="false"><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="1.5*"></colgroup><tbody><tr id="6f6e5ebc30cul"><td id="1e00f4ded1xca" rowspan="1" colspan="1"><p id="fb1f026dd8m3v"><b>参数</b></p></td><td id="15bd8f895ewoy" rowspan="1" colspan="1"><p id="4eef34feb7eik"><b>类型</b></p></td><td id="bbc31cb497rx3" rowspan="1" colspan="1"><p id="91e9987ae03kp"><b>参数说明</b></p></td></tr><tr id="28655cba4dzfa"><td id="84a6bb541fhx8" rowspan="1" colspan="1"><p id="9fe4b9f9eaxke">which</p></td><td id="57fca6cb1413r" rowspan="1" colspan="1"><p id="3a03c06ff324o">String</p></td><td id="0b1a3b013c1yd" rowspan="1" colspan="1"><p id="b5ebdd8ef5y9v">事件名称。</p></td></tr><tr id="19c2419ad2db2"><td id="c41eec4a7amnc" rowspan="1" colspan="1"><p id="df946264b65qv">handler</p></td><td id="faa4867f7fpuz" rowspan="1" colspan="1"><p id="b34cfb825enxm">Function</p></td><td id="12d23daa8cc0e" rowspan="1" colspan="1"><p id="39fc84bf60qki">回调函数。</p></td></tr></tbody></table>

其中，`which`参数对应的事件如下：

<table id="ec4b525cdcj8d" tablewidth="708" tablecolswidth="102 153 164 289" autofit="false"><colgroup colwidth="0.58*"></colgroup><colgroup colwidth="0.86*"></colgroup><colgroup colwidth="0.93*"></colgroup><colgroup colwidth="1.63*"></colgroup><tbody><tr id="41ab80a64e69i"><td id="dbf31994275yh" rowspan="1" colspan="1"><p id="d86734b0ed90t"><b>事件名称</b></p></td><td id="f3322a201c6w0" rowspan="1" colspan="1"><p id="b163de311cvnp"><b>事件说明</b></p></td><td id="0bb62635c2q17" rowspan="1" colspan="1"><p id="b96facead2fd6"><b>回调函数参数个数</b></p></td><td id="e5253cf911rj2" rowspan="1" colspan="1"><p id="a68ef803d2knm"><b>回调函数参数说明</b></p></td></tr><tr id="5067b5a1c0r2z"><td id="d7b43934bf56x" rowspan="1" colspan="1"><p id="384122453dhs2">meta</p></td><td id="c1cf358131itz" rowspan="1" colspan="1"><p id="5c6b9505859b5">字幕回调。</p></td><td id="3660c1d20daol" rowspan="1" colspan="1"><p id="72efb73fe9tjx">1</p></td><td id="05b8b7497a6x3" rowspan="1" colspan="1"><p id="d9d09afd49b31">String<span></span>类型，字幕信息。</p></td></tr><tr id="c401f88954tz9"><td id="2cea5887b8wwc" rowspan="1" colspan="1"><p id="2d4d34b7525mu">data</p></td><td id="0abdebd3bdeq0" rowspan="1" colspan="1"><p id="7335a374301eo">合成音频回调。</p></td><td id="c1f9317b4adbz" rowspan="1" colspan="1"><p id="121fd979be1sv">1</p></td><td id="a94672ca88snf" rowspan="1" colspan="1"><p id="8097657c04gcq">Buffer<span></span>类型，合成音频数据。</p></td></tr><tr id="0c77fb98a1ezx"><td id="8b46cb20eeymk" rowspan="1" colspan="1"><p id="33afa9315ex8e">completed</p></td><td id="1b746fb30dcmw" rowspan="1" colspan="1"><p id="25818f574fgya">语音合成完成。</p></td><td id="bffd228fa0m7v" rowspan="1" colspan="1"><p id="ceff25b51cbpj">1</p></td><td id="fb97e15e074u2" rowspan="1" colspan="1"><p id="ea89662ea71q1">String<span></span>类型，完成信息。</p></td></tr><tr id="6794f6c7ebjy2"><td id="6fe1736cd31qd" rowspan="1" colspan="1"><p id="073d049ad1396">closed</p></td><td id="1c19bd1267qd9" rowspan="1" colspan="1"><p id="d12cc0e6b6jdd">连接关闭。</p></td><td id="2237602d9dqtf" rowspan="1" colspan="1"><p id="5c2abef2b5hqh">0</p></td><td id="4d89f2bffajza" rowspan="1" colspan="1"><p id="26d7e0ee42fha">无。</p></td></tr><tr id="40ef25be73n96"><td id="1ab8bc3bd8a03" rowspan="1" colspan="1"><p id="20372c26566vf">failed</p></td><td id="ebd8f883732l1" rowspan="1" colspan="1"><p id="4197f860ecjy3">错误。</p></td><td id="703e6a5016ozq" rowspan="1" colspan="1"><p id="4b4023b4c1sph">1</p></td><td id="2de69de306agl" rowspan="1" colspan="1"><p id="d788930ceent2">String<span></span>类型，错误信息。</p></td></tr></tbody></table>

示例：

```nodejs
let tts = new Nls.SpeechSynthesizer({ url: URL, appkey:APPKEY, token:TOKEN }) tts.on("meta", (msg)=>{ console.log("Client recv metainfo:", msg) }) tts.on("data", (msg)=>{ console.log(`recv size: ${msg.length}`) console.log(dumpFile.write(msg, "binary")) }) tts.on("completed", (msg)=>{ console.log("Client recv completed:", msg) }) tts.on("closed", () => { console.log("Client recv closed") }) tts.on("failed", (msg)=>{ console.log("Client recv failed:", msg) })
```

### **4\. 任务开启：**`**start**`

`start`函数如下，根据传入的[param](https://help.aliyun.com/zh/isi/developer-reference/sdk-for-node-js-1?spm=a2c4g.11186623.help-menu-30413.d_3_1_0_7.517f1d63IdtMzF#270bf67f6b6t9)的信息，开始语音合成，服务器会通过调用回调函数`on`返回语音合成的结果等信息。

```nodejs
async start(param, enablePing, pingInterval)
```

参数说明：

<table id="53ad720e909e4" tablewidth="709" tablecolswidth="177 177 355" autofit="false"><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="0.75*"></colgroup><colgroup colwidth="1.5*"></colgroup><tbody><tr id="2bf2b7445aw5w"><td id="3221e0b1c62ju" rowspan="1" colspan="1"><p id="f2985b56318s9">参数</p></td><td id="c1dfcde9620x0" rowspan="1" colspan="1"><p id="ca9b44a4977cg">类型</p></td><td id="e1b1471cf9rm9" rowspan="1" colspan="1"><p id="2385b6640bxxu">参数说明</p></td></tr><tr id="b640f6806b7o8"><td id="f20eede852i7h" rowspan="1" colspan="1"><p id="9afb23eefbz29">param</p></td><td id="83733a812ekh5" rowspan="1" colspan="1"><p id="9a97c84aab02z">Object</p></td><td id="7480d500ac7bn" rowspan="1" colspan="1"><p id="9f3098d3f4f7q">语音合成参数。</p></td></tr><tr id="8c7380e73e7li"><td id="44671812fcvho" rowspan="1" colspan="1"><p id="0cd4144f93ojy">enablePing</p></td><td id="76258537afcm8" rowspan="1" colspan="1"><p id="ad1e4f4f82b5h">Boolean</p></td><td id="a513cac07bmu0" rowspan="1" colspan="1"><p id="b7a604f9f8sij">是否自动向云端发送<span></span>ping<span></span>请求，默认<span></span>false。</p><ul id="8249744992ak6"><li id="0ff690fb70x3g"><p id="898f4d3cb8ith">true：发送。</p></li><li id="d05dad8662ujg"><p id="bbe832d41fv3b">false：不发送。</p></li></ul></td></tr><tr id="eb75e2398162f"><td id="a289b833b89s3" rowspan="1" colspan="1"><p id="87181a16df4mu">pingInterval</p></td><td id="1dbffa451d49y" rowspan="1" colspan="1"><p id="570367ce5bdr1">Number</p></td><td id="9a5ffe7c49lmm" rowspan="1" colspan="1"><p id="d7eba92009yj1">发<span></span>ping<span></span>请求间隔时间，默认<span></span>6000，单位为毫秒。</p></td></tr></tbody></table>

返回值： Promise对象，当错误发生后携带异常信息。

## 代码示例

```nodejs
"use strict" require('log-timestamp')(`${process.pid}`) const fs = require("fs") const Nls = require("alibabacloud-nls") const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs)) const util = require("util") const readline = require("readline") const args = process.argv.slice(2) //const Memwatch = require("node-memwatch-new") const URL = "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1" const APPKEY = "Your Appkey" //获取Appkey请前往控制台：https://nls-portal.console.aliyun.com/applist const TOKEN = "Your Token" //获取Token具体操作，请参见：https://help.aliyun.com/document_detail/450514.html let b1 = [] let loadIndex = 0 //let hd = new Memwatch.HeapDiff() let needDump = true async function runOnce(line) { console.log(`speak: ${line}`) loadIndex++ //let dumpFile = fs.createWriteStream(`${process.pid}.wav`, {flags:"w"}) let tts = new Nls.SpeechSynthesizer({ url: URL, appkey:APPKEY, token:TOKEN }) tts.on("meta", (msg)=>{ console.log("Client recv metainfo:", msg) }) tts.on("data", (msg)=>{ console.log(`recv size: ${msg.length}`) //console.log(dumpFile.write(msg, "binary")) }) tts.on("completed", (msg)=>{ console.log("Client recv completed:", msg) }) tts.on("closed", () => { console.log("Client recv closed") }) tts.on("failed", (msg)=>{ console.log("Client recv failed:", msg) }) let param = tts.defaultStartParams() // 待合成文本 param.text = line // 发音人 param.voice = "aixia" // 语调，范围是-500~500，可选，默认是0 // param.pitch_rate = 100 // 语速，范围是-500~500，默认是0 // param.speech_rate = 100 // 设置返回音频的编码格式 // param.format = "wav" // 设置返回音频的采样率 // param.sample_rate = 16000 // 是否开启字级别时间戳 // param.enable_subtitle = true try { await tts.start(param, true, 6000) } catch(error) { console.log("error on start:", error) return } finally { //dumpFile.end() } console.log("synthesis done") await sleep(2000) } async function test() { console.log("load test case:", args[0]) const fileStream = fs.createReadStream(args[0]) const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity }) for await (const line of rl) { b1.push(line) } while (true) { for (let text of b1) { await runOnce(text) } } } test()
```