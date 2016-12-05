const builder = require("botbuilder"),
      restify = require("restify"),
      dotenv = require("dotenv"),
      githubClient = require("./github-client");

// load environment variables
dotenv.load();

let luisUrl = process.env.LUIS_MODEL;

let connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

let bot = new builder.UniversalBot(connector),
    recognizer = new builder.LuisRecognizer(luisUrl),
    dialog = new builder.IntentDialog({ recognizers: [recognizer] });

// helper function to create a hero card
const createCard = (session, profile) => {
    let card = new builder.HeroCard(session);
    card.title(profile.login);
    card.images([builder.CardImage.create(session, profile.avatar_url)]);
    card.buttons([builder.CardAction.openUrl(session, profile.html_url, "See Profile")]);
    return card;
};

let findUser = (session, args, next) => {
    session.dialogData.entities = args.entities;
    let query = builder.EntityRecognizer.findEntity(args.entities, "User");
    console.log(query);
    if (query) {
        next({ response: query.entity });
    } else {
        builder.Prompts.text(session, "Who are you searching for?");
    }
};

let showResults = (session, result, next) => {
    const query = result.response;
    if (!query) {
        session.endDialog("The request has been cancelled");
    } else {
        githubClient.executeSearch(query, profiles => {
            const totalCount = profiles.total_count;
            if (totalCount === 0) {
                session.endDialog("Sorry, no results found.");
            } else if (totalCount > 10) {
                session.endDialog("More than 10 results were found. Please provide a more restrictive query.");
            } else {
                // convert results into an array of cards
                let cards = profiles.items.map(item => createCard(session, item));
                // ask what profile it wanna load
                // builder.Prompts.choice(session, "What profile do you wanna load?", usernames);
                let message = new builder.Message(session).attachments(cards);
                session.send(message);
            }
        });
    }
}

// SearchUser is the Intent name in Luis
dialog.matches("SearchUser", [ findUser, showResults ]);
dialog.onDefault(builder.DialogAction.send("Sorry I did not understand"));

bot.dialog("/", dialog);

let server = restify.createServer();
server.post("/api/messages", connector.listen());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log("%s listening to %s", server.name, server.url);
});