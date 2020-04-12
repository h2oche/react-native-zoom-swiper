import * as React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  GestureResponderEvent
} from 'react-native';

export interface ZoomViewProps {
  data: { uri: string; id: number; };
  swipeTo: ( index: number ) => void;
  curIndex: number;
}

export interface ZoomViewState {
}

const styles = StyleSheet.create( {
  container: {
    flex: 1
  },
  image: {
    flex: 1,
    width: undefined,
    height: undefined
  }
} );

export default class ZoomViewComponent extends React.Component<ZoomViewProps, ZoomViewState> {
  constructor ( props: ZoomViewProps ) {
    super( props );
    this.state = {
    };
  }

  private onPressIn ( event: GestureResponderEvent ) {
    const { nativeEvent } = event;
    const { pageX, pageY } = nativeEvent;
    console.log( pageX, pageY );
  }

  private onPressOut ( event: GestureResponderEvent ) {
    const { nativeEvent } = event;
    const { pageX, pageY } = nativeEvent;
    console.log( pageX, pageY );
  }

  private next () {
    const { swipeTo, curIndex } = this.props;
    swipeTo( curIndex + 1 );
  }

  private prev () {
    const { swipeTo, curIndex } = this.props;
    swipeTo( curIndex - 1 );
  }

  public render () {
    const { data } = this.props;
    var { height, width } = Dimensions.get( 'window' );
    return (
      <View style={ { ...styles.container, height, width } }>
        <Image
          source={ data }
          style={ styles.image }
          resizeMode="contain" />
      </View>
    );
  }
}
