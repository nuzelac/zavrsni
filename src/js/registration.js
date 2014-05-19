jQuery(function() {
	$('#register').click(function(e) {
		e.preventDefault();

		$.post('/api/register', {
			username: $('#username').val(),
			password: $('#password').val()
		}).success(function(data) {
			if(data.success === true) {
				window.location = "/";
			} else {
				alert(data.error);
			}
		}).fail(function(data) {
			alert("Error! Please try again later");
		});
	});	

});		
