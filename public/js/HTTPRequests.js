$(document).ready(function() {

    $("#getHighScores").click(function(event){

        $.get('getHighScores', function(data, result){
            // Separate div for top 3
            for(var i = 0; i < 3; i++) {
                if (i < data.leaders.length) {
                    var el = data.leaders[i];
                    $('#topLeaders').append("<li>"+el.username+"    "+el.score+"</li>");
                }
            }

            // Rest of leaderboard
            for(var i = 3; i < data.leaders.length; i++) {
                var el = data.leaders[i];
                $('#leaders').append("<li>"+el.username+"    "+el.score+"</li>");
            }
        });

        $("#leaderContainer").height(window.innerHeight / 2);

    });

    $("getHighScores").on("tap", function() {
        $("getHighScores").click();
    })

});
