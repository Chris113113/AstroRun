$(document).ready(function() {

    $("#getHighScores").click(function(event){

        $.get('getHighScores', function(data, result){
            $('#leaders').html("<li>"+data.leaders[0].username+"    "+data.leaders[0].score+"</li>");
            $('#leaders').append("<li>"+data.leaders[1].username+"    "+data.leaders[1].score+"</li>");
            $('#leaders').append("<li>"+data.leaders[2].username+"    "+data.leaders[2].score+"</li>");
            $('#leaders').append("<li>"+data.leaders[3].username+"    "+data.leaders[3].score+"</li>");
            $('#leaders').append("<li>"+data.leaders[4].username+"    "+data.leaders[4].score+"</li>");
        });

    });

});
