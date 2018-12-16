const https = require('https');
const fs = require('fs');
var readline = require('readline-sync');
var app_id = "";
var app_key = "";
var usage = "Usage:\n./dict <def|syn|ant> <word>";
var word = "";
var word_arr = ['good','bad','simple','extraordinary']
var playflag = false;
var play_list = [[],[],[]];

var app_init = function(cb) {
    fs.readFile('./secret.json','ascii', (err, data) => {
        if (err) throw err;
        data = JSON.parse(data);
        app_id = data["app_id"]
        app_key = data["app_key"]
        if(process.argv.length == 2){
            word = 'good';
            cb('wod');
        }
        else if(process.argv.length == 4){
            word = process.argv[3];
            cb(process.argv[2]);
        }
        else if(process.argv.length == 3 && process.argv[2]=='play'){
            cb(process.argv[2]);
        }
        else{
            console.log('Invalid Arguments!\n' + usage);
            return;
        }
    });
}

var oxforddictionarycall = function(type,cb){
    var params = {
        host :  'od-api.oxforddictionaries.com',
        path : '/api/v1/entries/en/'+type,
        method : 'GET',
        headers : {
            "Accept": "application/json",
            "app_id": app_id,
            "app_key": app_key
        }
    };
    var wod=false;
    var cb_count=3;
    if(typeof cb=='number'){
        wod=true;
        cb_count = cb;
        cb=printerr;
    }
    try{
    https.get(params, function(res) {
        if(res.statusCode == 404){
            cb("No such entry found");
        }
        else{
            var data = "";
            res.on('data', function(chunk) {
                    data +=  chunk;
            }).on('end',function(){
                try {
                    result = JSON.parse(data);
                } 
                catch (exp) {
                    cb('JSON Parse failed');
                }
                if(wod==true){
                    if(cb_count==0){ oxforddictionarycall(word+'/synonyms',cb_count+1); definition(null, result);}
                    else if(cb_count==1){ oxforddictionarycall(word+'/antonyms',cb_count+1); synonyms(null, result);}
                    else if(cb_count==2){ antonyms(null, result);}
                }
                else cb(null,result);
            }).on('error',function(err){
                cb(err);    
            });
        }
    });
    }
    catch(exp){
        console.log('Oops! Things didn\'t go as expected!');
        return;
    }
}; 

var wordplay = function(){
    //console.log(play_list[0]);
    //console.log(play_list[1]);
    //console.log(play_list[2]);
    var hint_text = 'Here\'s a hint, ';
    var game_test = '\nGuess the word: ';
    var hint_flag = 0;
    var hint_count = [0,0,0];
    var user_input = 'hint';
    while(true){
        if(user_input == 'hint'){
            if(hint_count[0]>=play_list[0].length && hint_count[1]>=play_list[1].length && hint_count[2]>=play_list[2].length){
                console.log('It\'s sad to inform you that, you\'ve exhausted all the available hints!\nNext time, maybe!');
                return;
            }
            console.log(hint_text + play_list[hint_flag][hint_count[hint_flag]%play_list[hint_flag].length%3]);
            hint_count[hint_flag]++;
            hint_flag = (hint_flag+1)%3;
        }
        else if(user_input == 'try again'){
            ;
        }
        else if(user_input == 'quit'){
            return;
        }
        else if(user_input.trim().toLowerCase() == word.toLowerCase()){
            console.log('Winner Winner, Chicken Dinner!');
            return;
        }
        else{
            console.log('Invalid Answer, try again!');
        }
        user_input = readline.question("Your Input: ");
    }
}

var definition = function(error, result){
    if(error) console.log(error);
    if(result){
        if(playflag==true){
            play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['definitions'][0]);
            return;
        }
        console.log('\nDefinition: '+result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['definitions'][0]);
    }
}

var synonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        if(playflag!=true) console.log('\nSynonyms: ');
        for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms']){
            if(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text'].indexOf(' ')==-1){
                if(playflag==true){
                    play_list[1].push('Synonyms: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
                    continue;
                }
                console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
            }
            else{
                if(playflag==true){
                    play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
                    continue;
                }
            }
        }
    }
}

var antonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        if(playflag!=true) console.log('\nAntonyms: ');
        for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms']){
            if(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text'].indexOf(' ')==-1){
                if(playflag==true){
                    play_list[2].push('Antonyms: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
                    continue;
                }
                console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
            }
            else{
                if(playflag==true){
                    play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
                }
            }
        }
    }
    if(playflag==true){
        wordplay();
    }
}

var printerr = function(err){
    console.log(err);
}

var run_app = function(type){
    try{
        if('def' == type)
            oxforddictionarycall(word,definition);
        else if('syn' == type)
            oxforddictionarycall(word+'/synonyms',synonyms);
        else if('ant' == type)
            oxforddictionarycall(word+'/antonyms',antonyms);
        else if('wod' == type){
            oxforddictionarycall(word_arr[Math.floor(((Math.random() * 100) % word_arr.length))],0);
        }
        else if('play' == type){
            playflag=true;
            word = word_arr[Math.floor(((Math.random() * 100) % word_arr.length))];
            oxforddictionarycall(word,0);
        }
        else
            console.log('Invalid Arguments!\n'+usage);
        }
    catch(exp){
        console.log('Oops! Things didn\'t go as expected!');
    }
}

app_init(run_app);