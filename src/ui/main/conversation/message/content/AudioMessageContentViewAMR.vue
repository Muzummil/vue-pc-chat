<template>
    <div>
        <div ref="container" class="audio-message-container" :style="widthStyle" @click="playVoice">

            <p v-if="message.direction === 0" class="duration">{{ duration }}"</p>
            <div class="volume-container">
                <i v-show="!message._isPlaying" class="icon-ion-android-volume-up"></i>
                <ScaleLoader v-show="message._isPlaying" :color="'#d2d2d2'" :height="'15px'" :width="'3px'"/>
            </div>
            <p v-if="message.direction === 1" class="duration">{{ duration }}"</p>
        </div>
        <!-- Start Speech Text -->
        <br>
        <div v-if="speechTextContent" class="speech-to-text">
            {{speechTextContent}}
        </div>
        <!-- End Speech Text -->
    </div>
    
    
</template>

<script>
import Message from "@/wfc/messages/message";
import Config from "@/config";
import ScaleLoader from 'vue-spinner/src/ScaleLoader'
import store from "../../../../../store";
const fs = require('fs');
const path = require('path');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const speechConfig = sdk.SpeechConfig.fromSubscription("81a0f68c4dcb4c42ac8e6e0717c0f71d", "southeastasia");
const request = require('request');

export default {
    name: "AudioMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        },

        data() {
            return {}
        },

        widthStyle() {
            return {
                width: '10px',
            }
        },
    },
    mounted() {
        if (this.duration) {
            let width = Math.ceil(this.duration / 60 * 300);
            width = width < 70 ? 70 : width;
            this.$refs.container.style.setProperty('--voice-width', width + 'px')
        }
    },
    methods: {
        getFilenameFromUrl(url){
            return url.substring(url.lastIndexOf('/') + 1);
        },
        convertSpeechToText(speechMessage){
            const remoteFileName = this.getFilenameFromUrl(speechMessage.content.remoteMediaUrl);
            if(!remoteFileName.includes('.wav')){
                console.log("Unsupported format for speech to text");
                return;
            }
            let localSaveDirectoryPath = __dirname;
            const isDevelopment = process.env.NODE_ENV !== 'production'
            if(isDevelopment){
                localSaveDirectoryPath = path.join( __dirname.split("node_modules")[0], "src/assets/" + remoteFileName).replace(/\\/g, "/");
            }else{
                localSaveDirectoryPath = __dirname.replace("app.asar", remoteFileName).replace(/\\/g, "/");
            }

            console.log("localSaveDirectoryPath", localSaveDirectoryPath)
            console.log("FILE", fs.existsSync(localSaveDirectoryPath), localSaveDirectoryPath)
            try {
                if(fs.existsSync(localSaveDirectoryPath)){
                    this.convertLocalFileToText(localSaveDirectoryPath);
                }else{
                    this.downloadAndConvertFile(localSaveDirectoryPath);
                }  
            } catch (error) {
                console.log(error)
            }
            
            // const electron = require('electron');
            // // Importing dialog module using remote
            // // const dialog = electron.remote.dialog;
            // // console.log("BG", __dirname.split("node_modules")[0])
            // console.log("FG", localSaveDirectoryPath)
            // fs.writeFile(localSaveDirectoryPath, 
            //             this.message.content.remoteMediaUrl, function (err) {
            //     if (err) throw err;
            //     console.log('Saved!', localSaveDirectoryPath);
            // });

            // dialog.showSaveDialog({
            //     title: 'Select the File Path to save',
            //     defaultPath: path.join(__dirname, '../assets/sample.txt'),
            //     // defaultPath: path.join(__dirname, '../assets/'),
            //     buttonLabel: 'Save',
            //     // Restricting the user to only Text Files.
            //     filters: [
            //         {
            //             name: 'Text Files',
            //             extensions: ['txt', 'docx']
            //         }, ],
            //     properties: []
            // }).then(file => {
            //     // Stating whether dialog operation was cancelled or not.
            //     console.log(file.canceled);
            //     if (!file.canceled) {
            //         console.log(file.filePath.toString());
                    
            //         // Creating and Writing to the sample.txt file
            //         fs.writeFile(localSaveDirectoryPath, 
            //                     'This is a Sample File', function (err) {
            //             if (err) throw err;
            //             console.log('Saved!');
            //         });
            //     }
            // }).catch(err => {
            //     console.log(err)
            // }); 

            // fs.writeFileSync("C:/Users/97156/Downloads", "hello world", 'utf-8');
        },
        
        playVoice() {
            this.$set(this.message, '_isPlaying', true);
            store.playVoice(this.message)
            this.convertSpeechToText(this.message);
        },
        downloadAndConvertFile(localSaveDirectoryPath ){
            this.downloadFile(this.message.content.remoteMediaUrl, localSaveDirectoryPath).then(res=>{
                setTimeout(() => {
                    this.convertLocalFileToText(res.path);
                }, 1000);
            }, (error)=>{
                console.log("RES2", error);
            });
        },

        downloadFile(remoteFileUrl, localPath){
            return new Promise(function(resolve, reject){
                let req = request({
                    method: 'GET',
                    uri: remoteFileUrl
                });

                let out = fs.createWriteStream(localPath);
                out.on('finish', () => {
                    console.log(`You have successfully created a ${localPath} copy. `);
                })
                req.pipe(out);
                resolve(out);
            });
        },
        convertLocalFileToText(localFilePath){
            try{
                let lastRecognized = '';
                let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(localFilePath));
                let autoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "zh-HK","zh-CN","zh-TW"]);
                let speechRecognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, autoDetectSourceLanguageConfig, audioConfig);
                speechRecognizer.startContinuousRecognitionAsync();
                speechRecognizer.recognizing = (s, e) => {
                    this.$set(this.message, 'speechText', lastRecognized + e.result.text);
                };
                speechRecognizer.recognized = (s, e) => {
                    let resultText = '';
                    resultText = e.result.text;
                    lastRecognized += resultText + ' ';
                    speechout.innerHTML = lastRecognized;
                    this.$set(this.message, 'speechText', lastRecognized);
                };
                speechRecognizer.canceled = (s, e) => {
                    console.log(`CANCELED: Reason=${e.reason}`);
                    this.$set(this.message, '_isPlaying', false);
                    if (e.reason == CancellationReason.Error) {
                        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                        console.log("CANCELED: Did you update the subscription info?");
                    }
                    speechRecognizer.stopContinuousRecognitionAsync();
                };
                speechRecognizer.sessionStopped = (s, e) => {
                    console.log("\n    Session stopped event.");
                    speechRecognizer.stopContinuousRecognitionAsync();
                };
            }catch(e){}
        },

    },

    computed: {
        voice() {
            return this.message.messageContent;
        },

        remotePath() {
            let voice = this.message.messageContent;
            return Config.AMR_TO_MP3_SERVER_ADDRESS + voice.remotePath;
        },

        duration() {
            let voice = this.message.messageContent;
            let times = voice.duration * 1000;
            let seconds = 0;

            if (times <= 60 * 1000) {
                seconds = Math.ceil(times / 1000);
            } else {
                seconds = 60;
            }
            return seconds;
        },
        speechTextContent(){
            return this.message.speechText;
        },
        // currentVoiceMessage(){
        //     // console.log("COMP",store.state.conversation.currentVoiceMessage)
        //     return store.state.conversation.currentVoiceMessage;
        // }
    },
    watch:{
        // currentVoiceMessage(newMessage, oldMessage){
        //     if(newMessage){
        //         // this.message = newMessage;
        //         // this.convertSpeechToText(this.message);
        //     }
        // }
    },
    components: {
        ScaleLoader
    }
}
</script>

<style lang="css" scoped>

.audio-message-container {
    margin: 0 10px;
    display: flex;
    width: 100%;
    align-items: center;
    --voice-width: 200px;
    justify-content: flex-end;
}
.message-in-container .audio-message-container{
    justify-content: flex-start !important;
}
.audio-message-container audio {
    outline: none;
    filter: sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%);
}

.volume-container {
    display: flex;
    height: 40px;
    width: var(--voice-width);
    min-width: 55px;
    background: white;
    border-radius: 5px;
    padding: 5px 10px;
    align-items: center;
    margin-right: 13px;
}

.volume-container i {
    color: #888888;
}

.volume-container div {
    margin-top: 5px;
}

.duration {
    color: #b2b2b2;
    padding: 8px;
}
.speech-to-text {
    background: white;
    border-radius: 5px;
    padding: 5px 10px;
    align-items: center;
    margin: 0 10px;
}
.message-out-container .speech-to-text{
    margin: 0px !important;
}

</style>
