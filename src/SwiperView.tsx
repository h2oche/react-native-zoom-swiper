import * as React from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  GestureResponderEvent,
  Dimensions
} from 'react-native';
import ZoomView from "./ZoomView";

export interface SwiperViewProps {
}

export interface SwiperViewState {
}

const styles = StyleSheet.create( {
  container: {

  }
} );

interface SwiperViewData {
  id: number;
  uri: string;
}

const data: SwiperViewData[] = [
  { id: 1, uri: "https://picsum.photos/200/300" },
  { id: 2, uri: "https://picsum.photos/300/300" },
  { id: 3, uri: "https://picsum.photos/400/300" },
  { id: 4, uri: "https://picsum.photos/100/300" },
  { id: 5, uri: "https://picsum.photos/200" },
  { id: 6, uri: "https://picsum.photos/200/300" },
]

export default class SwiperViewComponent extends React.Component<SwiperViewProps, SwiperViewState> {
  flatListRef: FlatList<SwiperViewData> | null;
  maxIndex: number;
  curIndex: number;
  start?: { x: number; y: number; };
  constructor ( props: SwiperViewProps ) {
    super( props );
    this.state = {
    };
    this.flatListRef = null;
    this.maxIndex = data.length;
    this.curIndex = 0;
    this.start = undefined;
  }

  private swipeTo ( index: number ) {
    if ( this.flatListRef === null ) {
      Alert.alert( "SwiperViewComponent::next", "flatListRef is null" );
      return;
    }

    this.flatListRef.scrollToIndex( { animated: true, index } );
  }

  private renderSwiperItem ( index: number, item: SwiperViewData ) {
    return ( <ZoomView
      data={ item }
      curIndex={ index }
      swipeTo={ ( index ) => this.swipeTo( index ) } /> );
  }

  private onMove ( event: GestureResponderEvent ) {
    const { nativeEvent } = event;
    const { pageX, pageY } = nativeEvent;

    console.log( 'onMove', pageX, pageY );

    if ( this.start === undefined ) {
      this.start = { x: pageX, y: pageY };
      console.log( this.start );
    }
  }

  private onRelease ( event: GestureResponderEvent ) {
    const { nativeEvent } = event;
    const { pageX, pageY } = nativeEvent;

    console.log( 'onRelease', pageX, pageY );

    if ( this.start !== undefined ) {
      const { x, y } = this.start;
      const dx = pageX - x;
      const pagingThresold = Dimensions.get( 'screen' ).width / 3;

      if ( Math.abs( dx ) > pagingThresold ) {
        if ( dx < 0 ) this.curIndex += 1;
        else this.curIndex -= 1;

        if ( this.curIndex >= this.maxIndex ) this.curIndex = this.maxIndex - 1;
        else if ( this.curIndex < 0 ) this.curIndex = 0;

        this.swipeTo( this.curIndex );
      }

      this.start = undefined;
    }
  }

  public render () {
    return (
      <View>
        <FlatList
          onMoveShouldSetResponder={ () => true }
          onResponderMove={ ( event ) => this.onMove( event ) }
          onResponderRelease={ ( event ) => this.onRelease( event ) }
          data={ data }
          renderItem={ ( { item, index } ) => this.renderSwiperItem( index, item ) }
          horizontal={ true }
          ref={ ( ref ) => this.flatListRef = ref }
        />
      </View>
    );
  }
}
