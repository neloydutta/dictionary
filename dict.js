const https = require('https');
const fs = require('fs');
var readline = require('readline-sync');
var app_id = "";
var app_key = "";
var usage = "Usage:\nnode dict.js <def|syn|ant> <word>\nor\nnode dict.js play\nor\nnode dict.js";
var word = "";
var word_arr = ['discriminate', 'superb', 'compunction', 'prevail', 'ellipsis', 'cohere', 'opulence', 'conserve', 'quadrennium', 'privy', 'conifer', 'specify', 'icon', 'forecast', 'intervene', 'import', 'reduce', 'taint', 'inventory', 'contrived', 'laud', 'tensile', 'embark', 'vagary', 'fanciful', 'feral', 'scour', 'exodus', 'expurgate', 'reassure', 'appurtenance', 'thereby', 'astral', 'gather', 'chastise', 'predecessor', 'lethal','good', 'bad']
var playflag = false;
var play_list = [[],[],[]];

var app_init = function(cb) {
    if(fs.existsSync('./secret.json')){
        fs.readFile('./secret.json','ascii', (err, data) => {
            if (err) throw err;
            try{
                data = JSON.parse(data);
                app_id = data["app_id"]
                app_key = data["app_key"]
            }
            catch(exp){
                console.log('Application\'s Initialization failed!');
                process.exit(1);
            }
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
                process.exit(1);
            }
        });
    }
    else{
        console.log('Application\'s Initialization failed!');
        process.exit(1);
    }
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
                        cb('Application\' execution failed!');
                        process.exit(1);
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
        console.log('Application\'s execution failed!');
        process.exit(1);
    }
}; 

var wordplay = function(){
    var hint_text = 'Here\'s a hint, ';
    var game_text = '\nGuess the word with the help of hint given! (use option \'hint\' for more hints)';
    var hint_flag = 0;
    var hint_count = [0,0,0];
    var user_input = 'hint';
    console.log(game_text);
    while(true){
        if(user_input == 'hint'){
            if(hint_count[0]>=play_list[0].length && hint_count[1]>=play_list[1].length && hint_count[2]>=play_list[2].length){
                console.log('It\'s sad to inform you that, you\'ve exhausted all the available hints!\nNext time, maybe!');
                console.log('Word to be guessed was, "'+word.toUpperCase()+'"');
                return;
            }
            console.log(hint_text + play_list[hint_flag][hint_count[hint_flag]%play_list[hint_flag].length%3]);
            hint_count[hint_flag]++;
            hint_flag = (hint_flag+1)%3;
        }
        else if(user_input.trim().toLowerCase() == 'try again'){
            ;
        }
        else if(user_input.trim().toLowerCase() == 'quit'){
            return;
        }
        else if(user_input.trim().toLowerCase() == word.toLowerCase()){
            console.log('Winner Winner, Chicken Dinner!');
            return;
        }
        else{
            console.log('Invalid Answer, try again!');
        }
        try{
            user_input = readline.question("Your Input: ");
        }
        catch(exp){
            console.log('Application\'s execution failed!');
            process.exit(1);
        }
    }
}

var definition = function(error, result){
    if(error) console.log(error);
    if(result){
        try{
            if(playflag!=true) console.log('Definitions:');
            for(entry in result['results'][0]['lexicalEntries']){
                if(playflag==true){
                    play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][entry]['entries'][0]['senses'][0]['definitions'][0]);
                    continue;
                }
                console.log('  as '+result['results'][0]['lexicalEntries'][entry]['lexicalCategory']+': '+result['results'][0]['lexicalEntries'][entry]['entries'][0]['senses'][0]['definitions'][0]);                
            }
        }
        catch(exp){
            console.log('Application\'s execution failed!');
            process.exit(1);
        }
    }
}

var synonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        try{
            if(playflag!=true) console.log('\nSynonyms: ');
            for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms']){
                if(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text'].indexOf(' ')==-1){
                    if(playflag==true){
                        play_list[1].push('Synonyms: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
                        continue;
                    }
                    console.log('  '+result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
                }
                else{
                    if(playflag==true){
                        play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms'][entry]['text']);
                        continue;
                    }
                }
            }
        }
        catch(exp){
            console.log('Application\'s execution failed!');
            process.exit(1);
        }
    }
}

var antonyms = function(error, result){
    if(error) console.log(error);
    if(result) {
        try{
            if(playflag!=true) console.log('\nAntonyms: ');
            for(entry in result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms']){
                if(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text'].indexOf(' ')==-1){
                    if(playflag==true){
                        play_list[2].push('Antonyms: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
                        continue;
                    }
                    console.log('  '+result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
                }
                else{
                    if(playflag==true){
                        play_list[0].push('Definition: ' + result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms'][entry]['text']);
                    }
                }
            }
        }
        catch(exp){
            console.log('Application\'s execution failed!');
            process.exit(1);
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
        else if('play' == type && process.argv.length == 3){
            playflag=true;
            word = word_arr[Math.floor(((Math.random() * 100) % word_arr.length))];
            oxforddictionarycall(word,0);
        }
        else
            console.log('Invalid Arguments!\n'+usage);
        }
    catch(exp){
        console.log('Application\'s execution failed!');
        process.exit(1);
    }
}

app_init(run_app);