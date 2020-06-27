import CMS from "netlify-cms";
import uuid from 'uuid/v4';


//Create the control widget, this will add a form element to the cms UI
const IdControl = window.createClass({
	
    getInitialState: function() {    return {};  },
	
    componentDidMount: function() {
        // If this widget doesn't have an ID yet we create one using the UUID package
        if (!this.props.value) {
            this.props.onChange(uuid());
        }
    },	
	shouldComponentUpdate(nextProps, nextState){
		if (nextProps.value !== this.props.value && this.props.value !== undefined) {
			this.props.onChange(this.props.value); //change value back to new ID
			return false;
		}else{
			return true;
		}
	},
    render: function() {
        return window.h('p', null , this.props.value);
    }
});


//Create the preview widget, this will display the widgets value in the NetlifyCMS preview pane
const IdPreview = window.createClass({  
    getInitialState: function() { console.log(this.props); return {}; }, 
    render: function() { 
        return window.h('p', null, `Id: ${this.props.value}`);
    }
});

// Register the widget. This lets NetlifyCMS know about our custom widget
CMS.registerWidget('uuid', IdControl, IdPreview);

/**

CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    console.log(`preSave triggered!!! with: ${entry.get('data').get('gen_id')}`);
    if (entry.get('data').get('gen_id') === undefined){
        //new entry
        return entry.get('data').set('gen_id', uuid());
    }else{
        //update of entry -> keep value!
        //return entry.get('data').set('gen_id', entry.get('data').get('gen_id'));
        return;
    }
  },
});*/
