$(document).ready(function() {

    $("#getHighScores").click(function(event){

        $.get('getHighScores', function(data, result){
            $('#leaders').html("<li>"+data.leaders[0].username+"    "+data.leaders[0].score+"</li>");
            data.leaders.forEach( function(el) {
                $('#leaders').append("<li>"+el.username+"    "+el.score+"</li>");
            });
        });

        $("#getHighScoresContainer").height(window.innerHeight / 2);

    });

    $("getHighScores").on("tap", function() {
        $("getHighScores").click();
    })

});
