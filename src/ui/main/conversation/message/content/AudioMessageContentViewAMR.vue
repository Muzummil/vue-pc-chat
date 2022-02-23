<template>
    <div ref="container" class="audio-message-container" :style="widthStyle" @click="playVoice">
        DDD
        <!--    <i class="icon-ion-android-volume-up"></i>-->
        <!--    <span> {{ duration }} </span>-->

        <!--        <audio preload="auto" controls controlsList="nodownload">-->
        <!--            <source :src="remotePath" type="audio/mp4"/>-->
        <!--        </audio>-->

        <p v-if="message.direction === 0" class="duration">{{ duration }}"</p>
        <div class="volume-container">
            <i v-show="!message._isPlaying" class="icon-ion-android-volume-up"></i>
            <ScaleLoader v-show="message._isPlaying" :color="'#d2d2d2'" :height="'15px'" :width="'3px'"/>
        </div>
        <!--        <div class="dot"></div>-->
        <p v-if="message.direction === 1" class="duration">{{ duration }}"</p>
    </div>
</template>

<script>
import Message from "@/wfc/messages/message";
import Config from "@/config";
import ScaleLoader from 'vue-spinner/src/ScaleLoader'
import BenzAMRRecorder from "benz-amr-recorder";
import store from "../../../../../store";
import { app } from 'electron';

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
        convertSpeechToText(){
            console.log(this.message.content.remoteMediaUrl)
            const fs = require('fs');
            const path = require('path');
            const sdk = require("microsoft-cognitiveservices-speech-sdk");
            const speechConfig = sdk.SpeechConfig.fromSubscription("81a0f68c4dcb4c42ac8e6e0717c0f71d", "southeastasia");
            speechConfig.speechRecognitionLanguage = "zh-CN";
            const localSaveDirectoryPath = path.join( __dirname.split("node_modules")[0], "audio/" + this.message.content.searchableContent + ".mav");
            const electron = require('electron');
            // Importing dialog module using remote
            // const dialog = electron.remote.dialog;
            console.log("BG", __dirname.split("node_modules")[0])
            console.log("FG", localSaveDirectoryPath)
            fs.writeFile(localSaveDirectoryPath, 
                        this.message.content.remoteMediaUrl, function (err) {
                if (err) throw err;
                console.log('Saved!', localSaveDirectoryPath);
            });

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

            let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync("C:/Users/97156/Downloads/chinease.wav"));
            console.log("audioConfig", audioConfig)
            let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            speechRecognizer.startContinuousRecognitionAsync((result) => {
                console.log("SPEECH", result)
                switch (result.reason) {
                    case sdk.ResultReason.RecognizedSpeech:
                        console.log(`RECOGNIZED: Text=${result.text}`);
                        break;
                    case sdk.ResultReason.NoMatch:
                        console.log("NOMATCH: Speech could not be recognized.");
                        break;
                    case sdk.ResultReason.Canceled:
                        const cancellation = CancellationDetails.fromResult(result);
                        console.log(`CANCELED: Reason=${cancellation.reason}`);

                        if (cancellation.reason == sdk.CancellationReason.Error) {
                            console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                            console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
                            console.log("CANCELED: Did you update the key and location/region info?");
                        }
                        break;
                }    
                speechRecognizer.close();
            });
        },
        playVoice() {
            console.log("MSG", this.message)
            this.$set(this.message, '_isPlaying', true);
            store.playVoice(this.message)
            this.convertSpeechToText();
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

</style>
